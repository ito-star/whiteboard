import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Radio from "@material-ui/core/Radio";
import Linkify from "react-linkify";
import React, { useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import DragHandleIcon from "@material-ui/icons/DragHandleOutlined";
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import { makeBoardBlockMetadataUpdate } from "./utils";
import useDebouncedCallback from "./useDebouncedCallback";
import useUser from "./auth/useUser";

export default function CheckboxList(props) {
  const { data, board_id, block_id, checked: checkedProps } = props;
  const dbPath = `blocks/${board_id}/${block_id}`;
  const [checked, setChecked] = React.useState(checkedProps);
  const [listItemSorted, setListItemSorted] = React.useState(data);
  const { user } = useUser();
  const debouncedSave = useDebouncedCallback(
    (items) => {
      firebase
        .database()
        .ref(`/blocks/${board_id}`)
        .child(block_id)
        .update({ data: items });
    },
    [board_id, block_id],
    500
  );

  useEffect(() => {
    setListItemSorted(data);
  }, [data]);

  const handleToggle = (value) => () => {
    const currentIndex = checked.indexOf(value.id);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value.id);
    } else {
      newChecked.splice(currentIndex, 1);
    }
    firebase
      .database()
      .ref()
      .update({
        [`${dbPath}/checked`]: newChecked,
        ...makeBoardBlockMetadataUpdate(board_id, block_id, user.wbid),
      });

    setChecked(newChecked);
  };

  const handleClick = (event) => {
    event.stopPropagation();
  };

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
  };

  const getRenderItem = (items) => (provided, snapshot, rubric) => {
    const labelId = `${block_id}-checkbox-list-label-${
      items[rubric.source.index].id
    }`;
    const { innerRef, dragHandleProps, draggableProps } = provided;

    return (
      <div ref={innerRef} {...draggableProps} {...dragHandleProps}>
        <ListItem
          key={items[rubric.source.index].id}
          role={undefined}
          dense
          button
          onClick={handleToggle(items[rubric.source.index])}
        >
          <ListItemIcon>
            <Radio
              edge="start"
              checked={checked.indexOf(items[rubric.source.index].id) !== -1}
              tabIndex={-1}
              disableRipple
              inputProps={{ "aria-labelledby": labelId }}
            />
          </ListItemIcon>
          <ListItemText
            id={labelId}
            primary={
              <Linkify // componentDecorator is needed as a workaround as issue is still being fixed in Linkify https://github.com/tasti/react-linkify/issues/96
                componentDecorator={(decoratedHref, decoratedText, key) => (
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={decoratedHref}
                    key={key}
                    onClick={handleClick}
                  >
                    {" "}
                    {decoratedText}{" "}
                  </a>
                )}
              >
                {items[rubric.source.index].text}
              </Linkify>
            }
            secondary={items[rubric.source.index].description}
          />
          <DragHandleIcon />
        </ListItem>
      </div>
    );
  };

  const onDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = reorder(
      listItemSorted,
      result.source.index,
      result.destination.index
    );

    debouncedSave(items);
    setListItemSorted(items);
  };

  const renderItem = getRenderItem(listItemSorted);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable" renderClone={renderItem}>
        {(provided) => (
          <List
            className="checkbox-list"
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {listItemSorted.map((value, index) => {
              return (
                <Draggable key={value.id} draggableId={value.id} index={index}>
                  {renderItem}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </List>
        )}
      </Droppable>
    </DragDropContext>
  );
}
