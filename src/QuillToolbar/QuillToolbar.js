/* eslint-disable react/button-has-type */
import _without from "lodash/without";
import React from "react";
import PropTypes from "prop-types";
import "react-quill/dist/quill.snow.css";
import "./QuillToolbar.scss";
import { ThemeColors, boardColors } from "../constant";
import access from "../access";

function QuillToolbar(props) {
  const { isSkinny, user } = props;
  const themeColorsMinusNoColor = _without(boardColors, ThemeColors.NOCOLOR);

  return (
    <div id="toolbar">
      <select className="ql-font" defaultValue="arial">
        <option value="arial">Arial</option>
        {/* <option value="comic-sans">Comic-Sans</option>
        <option value="courier-new">Courier-New</option> */}
        <option value="georgia">Georgia</option>
        <option value="helvetica">Helvetica</option>
        <option value="lucida">Lucida</option>
        <option value="francoisone">Francois One</option>
        <option value="oswald">Oswald</option>
        <option value="ibmplexsans">IBM Plex Sans</option>
        <option value="roboto">Roboto</option>
        <option value="arimo">Arimo</option>
      </select>
      <select className="ql-size" defaultValue="12px">
        <option value="8px">8px</option>
        <option value="10px">10px</option>
        <option value="12px">12px</option>
        <option value="14px">14px</option>
        <option value="18px">18px</option>
        <option value="22px">22px</option>
        <option value="24px">24px</option>
        <option value="28px">28px</option>
        <option value="32px">32px</option>
        <option value="38px">38px</option>
      </select>
      <button className="ql-bold" />
      <button className="ql-italic" />
      <button className="ql-underline" />
      {!isSkinny && (
        <>
          <button className="ql-strike" />
          <button className="ql-list" value="ordered" />
          <button className="ql-list" value="bullet" />
          <select className="ql-align" defaultValue="justify">
            <option value="center" />
            <option value="right" />
            <option value="justify" />
          </select>
          <button className="ql-indent" value="-1" />
          <button className="ql-indent" value="+1" />
          {access.canUploadFiles(user) && <button className="ql-image" />}
          <select className="ql-color" defaultValue="">
            <option value="red" />
            <option value="green" />
            <option value="blue" />
            <option value="orange" />
            <option value="violet" />
            <option value="#d0d1d2" />
            {Object.values(themeColorsMinusNoColor).map((color) => (
              <option value={color} key={color} />
            ))}
          </select>
          <select className="ql-background" defaultValue="">
            <option value="red" />
            <option value="green" />
            <option value="blue" />
            <option value="orange" />
            <option value="violet" />
            <option value="#e0e8f0" />
            {Object.values(themeColorsMinusNoColor).map((color) => (
              <option value={color} key={color} />
            ))}
            <option value="transparent" />
          </select>
          <button className="ql-clean" />
          <button className="ql-link" />
        </>
      )}
    </div>
  );
}

QuillToolbar.defaultProps = {
  isSkinny: false,
};

QuillToolbar.propTypes = {
  isSkinny: PropTypes.bool,
};

export default QuillToolbar;
