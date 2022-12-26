/**
 * Copyright (c) 2022 Peking University and Peking University Institute for Computing and Digital Economy
 * SCOW is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *          http://license.coscl.org.cn/MulanPSL2
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */

import { FloatButton } from "antd";
import dynamic from "next/dynamic";
import Image from "next/image";
import React, { PropsWithChildren, useEffect, useState } from "react";
import { useLocalStorage } from "src/utils/hooks";

const modes = ["system", "dark", "light"] as const;


export type DarkMode = typeof modes[number];

const DarkModeContext = React.createContext<{
   mode: DarkMode;
   dark: boolean;
   setMode: (mode: DarkMode) => void;
     }>(undefined!);

export const useDarkMode = () => React.useContext(DarkModeContext);

// all are icons imported from svg files
export interface DarkModeButtonProps {
  light: string;
  system: string;
  dark: string;
}

const DarkModeButtonInternal = ({ dark, light, system }: DarkModeButtonProps) => {
  const { mode, setMode } = useDarkMode();

  const icons = {
    system: [system, "system", "跟随系统"],
    light: [light, "light", "亮色"],
    dark: [dark, "dark", "暗色"],
  };

  const [icon, alt, label] = icons[mode];

  return (
    <FloatButton
      onClick={() => setMode(mode === "system" ? "dark" : mode === "dark" ? "light" : "system")}
      icon={<Image src={icon} alt={alt} width={20} height={20} />}
      tooltip={label}
      // icon={icon}
    />
  );
};

const DARK_MODE_KEY = "scow-dark-mode";

// disable ssr for the button
// for the image rendered in server and client is different
export const DarkModeButton = dynamic(() => Promise.resolve(DarkModeButtonInternal), { ssr: false });

export const DarkModeProvider = ({ children }: PropsWithChildren<{}>) => {

  const [mode, setMode] = useLocalStorage<DarkMode>(DARK_MODE_KEY, "system");

  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (mode === "system") {

      const onChange = function(this: MediaQueryList, ev: MediaQueryListEvent) {
        setDark(ev.matches);
      };

      const media = window.matchMedia("(prefers-color-scheme: dark)");

      setDark(media.matches);

      media.addEventListener("change", onChange);

      return () => media.removeEventListener("change", onChange);
    } else {
      setDark(mode === "dark");
    }
  }, [mode]);

  return (
    <DarkModeContext.Provider value={{ mode, dark, setMode }}>
      {children}
    </DarkModeContext.Provider>

  );
};