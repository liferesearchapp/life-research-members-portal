import Router from "next/router";
import {
  createContext,
  type Dispatch,
  type FC,
  type PropsWithChildren,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { LanguageCtx } from "./language-ctx";
import { Button, Modal } from "antd";

type HistoryState = { url: string; as: string };
declare global {
  interface TypedHistory extends History {
    state: HistoryState;
  }
}
declare var history: TypedHistory;

export function useResetDirtyOnUnmount() {
  const { setDirty } = useContext(SaveChangesCtx);
  useEffect(() => {
    return () => setDirty(false);
  }, [setDirty]);
}

export const SaveChangesCtx = createContext<{
  dirty: boolean;
  setDirty: Dispatch<SetStateAction<boolean>>;
  setSubmit: Dispatch<SetStateAction<() => Promise<boolean>>>;
  saveChangesPrompt: (callbacks: {
    onSuccessOrDiscard: () => void | Promise<void>;
    onCancel?: () => void | Promise<void>;
  }) => void;
}>(null as any);

/** Keeps track of dirty form - sets `window.onbeforeunload`, and `router.beforePopState`
 * **WARNING: SUBMIT FUNCTIONS MUST BE WRAPPED IN `useCallback`!**
 */
export const SaveChangesCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  const { en } = useContext(LanguageCtx);
  const [dirty, setDirty] = useState(false);
  const [submit, setSubmit] = useState<() => Promise<boolean>>(async () => true);
  const [currentState, setCurrentState] = useState<HistoryState>({ url: "", as: "" });

  /**
   * Conditionally opens a prompt to notify users they have unsaved changes.
   *
   * If dirty is false, `onSuccessOrDiscard` will be called immediately.
   *
   * If the user selects discard, `onSuccessOrDiscard` will be called immediately.
   *
   * If the user selects cancel, `onCancel` will be called immediately.
   *
   * If the user selects save, the last registered `submit` function will be called,
   * then `onSuccessOrDiscard` will be called ONLY IF / WHEN `submit` returns `true`.
   *  */
  const saveChangesPrompt = useCallback(
    (callbacks: { onSuccessOrDiscard: () => void | Promise<void>; onCancel?: () => void }) => {
      if (!dirty) return callbacks.onSuccessOrDiscard();

      const modal = Modal.confirm({
        title: en ? "You have unsaved changes!" : "Vous avez des changements non enregistrés!",
        className: "save-changes-modal",
        width: "500px",
      });

      async function onSave() {
        modal.destroy();
        if (await submit()) {
          setDirty(false);
          callbacks.onSuccessOrDiscard();
        }
      }

      function onDiscard() {
        modal.destroy();
        setDirty(false);
        callbacks.onSuccessOrDiscard();
      }

      function onCancel() {
        callbacks.onCancel?.();
        modal.destroy();
      }

      modal.update({
        content: (
          <div className="button-container">
            <Button type="primary" onClick={onSave}>
              {en ? "Save" : "Sauvegarder"}
            </Button>
            <Button type="primary" danger onClick={onDiscard}>
              {en ? "Discard" : "Jeter"}
            </Button>
            <Button danger onClick={onCancel}>
              {en ? "Cancel" : "Annuler"}
            </Button>
          </div>
        ),
        onCancel: onCancel,
      });
    },
    [dirty, submit, en]
  );

  /** For refreshing / navigating away */
  useEffect(() => {
    if (dirty) window.onbeforeunload = () => true;
    if (!dirty) window.onbeforeunload = null;
  }, [dirty, saveChangesPrompt]);

  /** Clean up */
  useEffect(() => {
    return () => {
      window.onbeforeunload = null;
    };
  }, []);

  /** For back / forward navigation - on cancel we push the current state back on
   *  Unfortunately discards any forward history, but there's no way to stop the browser history index from moving */
  useEffect(() => {
    if (dirty) setCurrentState(history.state);
  }, [dirty]);

  useEffect(() => {
    if (dirty)
      Router.beforePopState((newState: HistoryState) => {
        saveChangesPrompt({
          onSuccessOrDiscard: () => {
            Router.push(newState.url, newState.as);
          },
          onCancel: () => {
            history.pushState(newState, "", newState.url);
            Router.push(currentState.url, currentState.as);
          },
        });
        return false;
      });
  }, [currentState, dirty, saveChangesPrompt]);

  /** Clean up */
  useEffect(() => {
    if (!dirty) {
      Router.beforePopState(() => true);
    }
  }, [dirty]);

  /** Clean up */
  useEffect(() => {
    return () => {
      Router.beforePopState(() => true);
    };
  }, []);

  return (
    <SaveChangesCtx.Provider value={{ dirty, setDirty, setSubmit, saveChangesPrompt }}>
      {children}
    </SaveChangesCtx.Provider>
  );
};
