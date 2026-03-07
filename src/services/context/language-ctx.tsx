import {
  createContext,
  type FC,
  type PropsWithChildren,
  useEffect,
  useState,
} from "react";

const cacheKey = "preferred-language";
export let en = true; // For use outside components

export const LanguageCtx = createContext<{
  en: boolean;
  toggleLanguage: () => void;
}>(null as any);

export const LanguageCtxProvider: FC<PropsWithChildren> = ({ children }) => {
  // If english is false, french
  const [_en, setEnglish] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(cacheKey) === "false") {
      en = false;
      setEnglish(false);
    }
  }, []);

  function toggleLanguage() {
    setEnglish((prev) => {
      en = !prev;
      localStorage.setItem(cacheKey, String(!prev));
      return !prev;
    });
  }

  return (
    <LanguageCtx.Provider value={{ en: _en, toggleLanguage }}>
      {children}
    </LanguageCtx.Provider>
  );
};
