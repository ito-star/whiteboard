import React, { useEffect, useRef, useMemo } from "react";
import hoistNonReactStatics from "hoist-non-react-statics";
import { getDisplayName } from "@material-ui/utils";
import DatabaseEventManager from "../DatabaseEventManager";

const withOnDatabaseEvent = () => (Component) => {
  const WithOnDatabaseEvent = React.forwardRef((props, ref) => {
    const dbEventManagerRef = useRef(new DatabaseEventManager());

    useEffect(() => {
      const dbEventManager = dbEventManagerRef.current;

      return () => {
        dbEventManager.unsubscribe();
      };
    }, []);

    const onDatabaseEvent = useMemo(() => {
      const dbEventManager = dbEventManagerRef.current;

      return dbEventManager.on.bind(dbEventManager);
    }, []);

    return <Component ref={ref} {...props} onDatabaseEvent={onDatabaseEvent} />;
  });

  if (process.env.NODE_ENV !== "production") {
    WithOnDatabaseEvent.displayName = `WithConfirm(${getDisplayName(
      Component
    )})`;
  }

  hoistNonReactStatics(WithOnDatabaseEvent, Component);

  return WithOnDatabaseEvent;
};

export default withOnDatabaseEvent;
