import * as React from "react";
import { useDispatch } from "react-redux";
import CustomizeBoardForm from "../BoardDetails/CustomizeBoardForm";
import BrandUploader from "../BoardDetails/BrandUploader";
import { setHeaderColor, setBodyColor } from "../actions/setting";
import useUser from "../auth/useUser";

const BrandingSection = () => {
  const dispatch = useDispatch();
  const { user } = useUser();

  React.useEffect(() => {
    dispatch(setHeaderColor(user.branding.boardHeaderColor));
    dispatch(setBodyColor(user.branding.boardBodyColor));
  }, [user, dispatch]);

  return (
    <div className="branding-section">
      <h1
        id="account"
        className="center account-header"
        style={{ fontSize: "36px" }}
      >
        Board Branding
      </h1>
      <div className="palette-section account-section">
        <CustomizeBoardForm />
      </div>
      <div className="palette-section account-section">
        <BrandUploader />
      </div>
    </div>
  );
};

export default BrandingSection;
