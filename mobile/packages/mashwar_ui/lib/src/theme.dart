import 'package:flutter/material.dart';

import 'tokens.dart';

/// Light theme for the rider app, dark theme for the captain app (matching the prototype).
ThemeData mashwarTheme({required bool dark}) {
  final scheme = ColorScheme.fromSeed(
    seedColor: MashwarColors.emerald,
    brightness: dark ? Brightness.dark : Brightness.light,
  ).copyWith(
    primary: MashwarColors.emerald,
    onPrimary: Colors.white,
    secondary: MashwarColors.gold,
    surface: dark ? MashwarColors.navy : Colors.white,
    onSurface: dark ? Colors.white : MashwarColors.ink,
    error: MashwarColors.statusCancelled,
  );
  return ThemeData(
    colorScheme: scheme,
    scaffoldBackgroundColor: dark ? MashwarColors.navy : MashwarColors.bg,
    // IBM Plex Sans Arabic / Inter are bundled in Phase 2 (font licensing: SIL OFL).
    fontFamilyFallback: const ['IBM Plex Sans Arabic', 'Inter'],
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(MashwarSpace.primaryCta),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(MashwarRadius.md)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
  );
}
