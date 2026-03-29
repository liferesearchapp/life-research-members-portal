import Button from "antd/lib/button";
import { FC, useContext } from "react";
import updateAccountRegisterMember from "../../services/update-account-register-member";
import { ActiveAccountCtx } from "../../services/context/active-account-ctx";
import { LanguageCtx } from "../../services/context/language-ctx";
import InstituteMembershipInvitations from "../accounts/institute-membership-invitations";

const MyProfileRegister: FC = () => {
  const { en } = useContext(LanguageCtx);
  const { localAccount, setLocalAccount } = useContext(ActiveAccountCtx);

  if (!localAccount) return null; // Auth guard should prevent this

  async function handleRegisterMember() {
    if (!localAccount) return;
    const res = await updateAccountRegisterMember(localAccount.id);
    setLocalAccount(res);
  }

  return (
    <div
      style={{
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "left" }}>
        <InstituteMembershipInvitations
          account={localAccount}
          setAccount={setLocalAccount}
          interactive
        />
      </div>
      <div style={{ height: "20vh" }}></div>
      <h1>
        {en ? "You have no member information!" : "Vous n'avez aucune information de membre !"}
      </h1>
      <h2>
        {en
          ? "Register as a member to tell us more about yourself."
          : "Inscrivez-vous en tant que membre pour nous en dire plus sur vous."}
      </h2>
      <Button
        type="primary"
        size="large"
        style={{ marginTop: 18 }}
        onClick={() => handleRegisterMember()}
      >
        {en ? "Register as Member" : "Inscrivez-vous en tant que membre"}
      </Button>
    </div>
  );
};

export default MyProfileRegister;
