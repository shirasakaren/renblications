import type { CSSProperties } from "react";

export interface ThemePalette {
  bg: string;
  surface: string;
  surfaceMuted: string;
  ink: string;
  inkMuted: string;
  line: string;
  accent: string;
  accentStrong: string;
  accentInk: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  light: ThemePalette;
  dark: ThemePalette;
}

const light = (
  bg: string,
  surface: string,
  muted: string,
  ink: string,
  inkMuted: string,
  line: string,
  accent: string,
  strong: string,
  accentInk = "#fffaf5",
): ThemePalette => ({
  bg,
  surface,
  surfaceMuted: muted,
  ink,
  inkMuted,
  line,
  accent,
  accentStrong: strong,
  accentInk,
});

const dark = (
  bg: string,
  surface: string,
  muted: string,
  ink: string,
  inkMuted: string,
  line: string,
  accent: string,
  strong: string,
  accentInk = "#11100f",
): ThemePalette => ({
  bg,
  surface,
  surfaceMuted: muted,
  ink,
  inkMuted,
  line,
  accent,
  accentStrong: strong,
  accentInk,
});

export const THEMES: ThemeDefinition[] = [
  {
    id: "vermilion",
    name: "Vermilion",
    description: "Graphite paper with a decisive red-orange mark.",
    light: light("#f3f2ee", "#faf9f6", "#e8e6e0", "#191816", "#67635d", "#d1cec6", "#b83d25", "#91301d"),
    dark: dark("#111110", "#191917", "#23221f", "#efede7", "#aaa69d", "#393732", "#e06a4e", "#f07a5c"),
  },
  {
    id: "manuscript",
    name: "Manuscript",
    description: "Quiet ivory with archival blue ink.",
    light: light("#f6f4ed", "#fcfbf7", "#ebe7dc", "#20211f", "#656960", "#d4d0c5", "#365d77", "#29485d"),
    dark: dark("#141615", "#1c1f1d", "#252a27", "#eff0ea", "#adb0a8", "#3a403c", "#7caac6", "#91bdd5"),
  },
  {
    id: "graphite",
    name: "Graphite",
    description: "A near-monochrome studio palette.",
    light: light("#f2f3f3", "#fafafa", "#e5e7e8", "#1b1d1f", "#61666a", "#cfd2d4", "#555d63", "#373d42"),
    dark: dark("#101214", "#181b1e", "#22262a", "#f0f2f3", "#a8afb4", "#383e43", "#aeb8bf", "#c5cdd2", "#131618"),
  },
  {
    id: "cobalt",
    name: "Cobalt",
    description: "Crisp blue against cool white.",
    light: light("#f3f6fb", "#fbfcfe", "#e7edf7", "#151b29", "#5d687e", "#ccd5e5", "#2456a6", "#1c4485"),
    dark: dark("#0d1422", "#141d2d", "#1d293d", "#eef3fb", "#a6b4ca", "#33435d", "#72a2ef", "#8ab2f3"),
  },
  {
    id: "forest",
    name: "Forest",
    description: "Deep green for long-form concentration.",
    light: light("#f2f6f2", "#fafcf9", "#e5ede5", "#172019", "#5c6d61", "#cad7cc", "#2d7148", "#225838"),
    dark: dark("#0e1711", "#152019", "#1e2c22", "#edf3ee", "#a6b6a9", "#334339", "#68ad7e", "#7fc093"),
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "A low-saturation teal research desk.",
    light: light("#f0f7f7", "#f9fcfc", "#e2eeee", "#132324", "#586f71", "#c8dada", "#247474", "#1b5959"),
    dark: dark("#0b1718", "#122123", "#1a2d30", "#eaf3f3", "#9eb4b6", "#2f4548", "#67b9b6", "#7ac9c5"),
  },
  {
    id: "plum",
    name: "Plum",
    description: "Muted aubergine with soft lilac accents.",
    light: light("#f7f3f7", "#fcfafc", "#eee5ee", "#251a25", "#746174", "#dccddd", "#755176", "#5c3d5d"),
    dark: dark("#181018", "#221721", "#30212f", "#f5edf4", "#beaabd", "#4b374a", "#c591c3", "#d5a4d2"),
  },
  {
    id: "sakura",
    name: "Sakura",
    description: "Pale rose with ink-like contrast.",
    light: light("#fbf3f5", "#fffafb", "#f4e3e8", "#281b1e", "#7a6268", "#e3cbd1", "#a64d63", "#833b4e"),
    dark: dark("#1a1013", "#25171b", "#332126", "#f7edef", "#c2a7ad", "#50363d", "#dc879a", "#e99aac"),
  },
  {
    id: "dune",
    name: "Dune",
    description: "Mineral sand and slate, kept intentionally cool.",
    light: light("#f5f3ef", "#fbfaf7", "#e9e5df", "#211f1c", "#6d6860", "#d5d0c8", "#73644d", "#554a39"),
    dark: dark("#15130f", "#1e1b16", "#29251e", "#f1eee7", "#b5aea1", "#403b32", "#bea77e", "#d0b88b"),
  },
  {
    id: "olive",
    name: "Olive",
    description: "Muted botanical greens with paper neutrals.",
    light: light("#f4f5ee", "#fbfcf7", "#e8eadc", "#202219", "#686c59", "#d2d5c4", "#62713a", "#4b572b"),
    dark: dark("#13150e", "#1c1f15", "#272b1d", "#f0f1e9", "#b0b49d", "#3d422f", "#a2b46d", "#b4c47f"),
  },
  {
    id: "glacier",
    name: "Glacier",
    description: "Silver surfaces and glacial cyan.",
    light: light("#f2f7f8", "#fbfdfe", "#e3eef0", "#152225", "#5d7277", "#c9dadd", "#347988", "#285f6b"),
    dark: dark("#0d1719", "#142124", "#1c2d31", "#edf4f5", "#a5b7bb", "#33474b", "#79bdc9", "#8ccbd5"),
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Blue-black surfaces with moonlit type.",
    light: light("#f1f4f8", "#fafbfd", "#e4e9f0", "#171c28", "#606a7d", "#ccd3df", "#3e5f8b", "#304a6d"),
    dark: dark("#0b101a", "#121826", "#1a2435", "#edf1f8", "#a5afc0", "#303c52", "#86a9dc", "#99b7e2"),
  },
  {
    id: "amber",
    name: "Amber",
    description: "Warm signal color over disciplined neutrals.",
    light: light("#f7f5ef", "#fcfbf8", "#ece8dd", "#242018", "#716858", "#dad3c5", "#8a641f", "#684a16"),
    dark: dark("#17130b", "#211b10", "#2d2518", "#f3efe5", "#b9ad96", "#463b29", "#d7a647", "#e4b85f"),
  },
  {
    id: "teal",
    name: "Teal",
    description: "Measured green-blue with clinical clarity.",
    light: light("#eff7f5", "#f9fcfb", "#e1eee9", "#14231f", "#596f68", "#c7dad2", "#277564", "#1d594c"),
    dark: dark("#0b1714", "#12211d", "#1a2d27", "#ebf4f1", "#9fb6af", "#30473f", "#6ab9a2", "#7ccab3"),
  },
  {
    id: "ruby",
    name: "Ruby",
    description: "A dark red accent with editorial restraint.",
    light: light("#f8f2f3", "#fcfafb", "#efe2e5", "#26191c", "#746066", "#dcc9cf", "#9b3c54", "#772d40"),
    dark: dark("#190f12", "#23161a", "#302026", "#f5edef", "#bda7ad", "#4a343b", "#d77b90", "#e590a2"),
  },
  {
    id: "mono",
    name: "Monochrome",
    description: "Pure hierarchy without a color dependency.",
    light: light("#f4f4f3", "#fbfbfa", "#e8e8e5", "#1c1c1b", "#656563", "#d0d0cc", "#4d4d4a", "#2f2f2d"),
    dark: dark("#111111", "#191919", "#232322", "#efefec", "#aaaaa5", "#393936", "#b9b9b2", "#d0d0c8", "#131312"),
  },
  {
    id: "lavender",
    name: "Lavender",
    description: "Cool lavender with graphite text.",
    light: light("#f6f4fa", "#fbfaff", "#ebe6f4", "#211d29", "#6c647b", "#d6cee3", "#665492", "#4e4070"),
    dark: dark("#14111b", "#1d1826", "#292235", "#f2eef8", "#b1a8c1", "#40364f", "#aa95d7", "#bba9e2"),
  },
  {
    id: "moss",
    name: "Moss",
    description: "Dense woodland neutrals and moss green.",
    light: light("#f3f5f0", "#fafbf8", "#e5e9df", "#1d211a", "#626a5b", "#ced4c7", "#4f7044", "#3b5533"),
    dark: dark("#10150e", "#171e15", "#202a1d", "#edf2e9", "#a7b2a1", "#354231", "#88ad7b", "#9bbd8f"),
  },
  {
    id: "terracotta",
    name: "Terracotta",
    description: "Earth red balanced by cool slate.",
    light: light("#f6f3f1", "#fcfaf9", "#ece5e1", "#251d1a", "#71635e", "#d8cec9", "#9b543c", "#773f2d"),
    dark: dark("#17110f", "#211815", "#2d211d", "#f3edeb", "#b7aaa5", "#463732", "#d98a70", "#e69d84"),
  },
  {
    id: "ink",
    name: "Ink",
    description: "Cold black, paper white, and fountain-pen blue.",
    light: light("#f3f5f6", "#fafcfd", "#e5eaed", "#141b20", "#5b6870", "#cbd4d9", "#315f7d", "#25485f"),
    dark: dark("#0d1215", "#141b1f", "#1c262c", "#edf2f4", "#a2afb5", "#303f47", "#72a7c5", "#86b7d0"),
  },
  {
    id: "celadon",
    name: "Celadon",
    description: "Pale ceramic green with dark jade.",
    light: light("#f1f7f2", "#f9fcfa", "#e2eee5", "#17221b", "#5c6f61", "#c8d9cc", "#347153", "#28573f"),
    dark: dark("#0d1610", "#142019", "#1c2b22", "#edf3ef", "#a4b5a8", "#324438", "#75b18c", "#89c19e"),
  },
  {
    id: "slate",
    name: "Slate",
    description: "Neutral blue-gray for technical reading.",
    light: light("#f2f4f6", "#fafbfc", "#e5e9ed", "#171c22", "#5e6874", "#ccd3da", "#4c647d", "#394b60"),
    dark: dark("#0f1318", "#171c22", "#202832", "#eff2f5", "#a5aeb8", "#35414d", "#91abc4", "#a5bad0"),
  },
  {
    id: "solar",
    name: "Solar",
    description: "Sun-washed yellow with grounded gray.",
    light: light("#f8f6ee", "#fdfcf7", "#eee9d9", "#252116", "#746b55", "#dcd4bd", "#856815", "#624c0e"),
    dark: dark("#161309", "#201b0e", "#2b2516", "#f3f0e4", "#b8af96", "#443c27", "#d9b74f", "#e4c467"),
  },
  {
    id: "nordic",
    name: "Nordic",
    description: "Cool daylight and a restrained pine accent.",
    light: light("#f3f7f6", "#fbfdfc", "#e5edeb", "#172120", "#5c6c69", "#cad7d4", "#356f68", "#28554f"),
    dark: dark("#0d1514", "#141e1d", "#1d2927", "#edf3f2", "#a4b3b0", "#33423f", "#76ada5", "#8bbdb6"),
  },
  {
    id: "bronze",
    name: "Bronze",
    description: "Oxidized metal tones with firm contrast.",
    light: light("#f5f4f0", "#fbfaf8", "#e9e6df", "#221f1a", "#6c675d", "#d5d0c7", "#756044", "#584933"),
    dark: dark("#15130f", "#1e1b16", "#29251e", "#f1eee8", "#b3aca0", "#403a31", "#bca27c", "#cdb38c"),
  },
  {
    id: "signal",
    name: "Signal",
    description: "Industrial gray with a safety-orange cue.",
    light: light("#f2f3f2", "#fafbfa", "#e5e7e5", "#1b1e1b", "#626762", "#cfd3cf", "#a84822", "#803719"),
    dark: dark("#101210", "#181b18", "#222622", "#eff1ee", "#a7ada7", "#373d37", "#df7650", "#ed8967"),
  },
];

export const DEFAULT_THEME_ID = "vermilion";

export function getTheme(id?: string | null): ThemeDefinition {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

export function themeStyle(id: string, mode: "light" | "dark"): CSSProperties {
  const palette = getTheme(id)[mode];
  return {
    "--bg": palette.bg,
    "--surface": palette.surface,
    "--surface-muted": palette.surfaceMuted,
    "--ink": palette.ink,
    "--ink-muted": palette.inkMuted,
    "--line": palette.line,
    "--accent": palette.accent,
    "--accent-strong": palette.accentStrong,
    "--accent-ink": palette.accentInk,
  } as CSSProperties;
}
