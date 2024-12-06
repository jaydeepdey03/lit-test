import {useGoogleAuth, useZkEmailSDK} from "@zk-email/zk-email-sdk";
import {Props} from "next/script";
import {useState} from "react";

export function ZkTest(props: Props) {
  const {
    googleAuthToken,
    isGoogleAuthed,
    loggedInGmail,
    googleLogIn,
    googleLogOut,
  } = useGoogleAuth();

  const {
    createInputWorker,
    generateInputFromEmail,
    generateProofRemotely,
    proofStatus,
    inputWorkers,
  } = useZkEmailSDK();

  const [externalInputs, setExternalInputs] = useState<Record<string, string>>(
    {}
  );

  // externalInputs - External inputs added when submitting a new pattern at https://registry-dev.zkregex.com/submit
  //   const entryExternalInputs = externalInputs as {name: string, maxLength: number}[] || [];
  const entryExternalInputs: {name: string; maxLength: number}[] = [];

  console.log(entryExternalInputs, "entryExternalInputs");
  for (const input of entryExternalInputs) {
    setExternalInputs({
      ...externalInputs,
      [input.name]: "",
    });
  }

  const generateInputFromEmailFunc = async () => {
    if (loggedInGmail) {
      try {
        const input = await generateInputFromEmail(
          "badgooooor/proof-completed-github-issue",
          loggedInGmail,
          externalInputs
        );

        console.log(input, "input");

        const proofRes = await generateProofRemotely(
          "badgooooor/proof-completed-github-issue",
          input
        );

        console.log(proofRes);
      } catch (error) {
        console.error(error);
      }
    } else {
      console.error("loggedInGmail is null");
    }
  };

  const consoleFunc = () => {
    console.log("Testing");

    console.log(proofStatus);
    console.log(inputWorkers);
  };

  return (
    <div>
      {/* Add your JSX here */}
      hello --
      {isGoogleAuthed ? (
        <div>
          <h1>Logged in as {loggedInGmail}</h1>
        </div>
      ) : (
        <div>
          <h1>Not logged in</h1>
        </div>
      )}
      {isGoogleAuthed ? (
        <button onClick={googleLogOut}>Log out</button>
      ) : (
        <button onClick={googleLogIn}>Log in</button>
      )}
      <button
        onClick={() => {
          console.log("calling");
          createInputWorker("badgooooor/proof-completed-github-issue");
        }}
      >
        Create Input Worker
      </button>
      <button onClick={generateInputFromEmailFunc}>
        {" "}
        Generate Input from Email
      </button>
      <button onClick={consoleFunc}>Console</button>
    </div>
  );
}
