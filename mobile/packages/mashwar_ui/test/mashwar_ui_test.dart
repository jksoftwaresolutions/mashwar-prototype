import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mashwar_ui/mashwar_ui.dart';

void main() {
  test('Arabic is the first supported locale', () {
    expect(supportedLocales.first, const Locale('ar'));
  });

  test('themes use the brand primary colour and a 56 px primary button', () {
    for (final dark in [false, true]) {
      final theme = mashwarTheme(dark: dark);
      expect(theme.colorScheme.primary, MashwarColors.emerald);
      expect(theme.filledButtonTheme.style!.minimumSize!.resolve({})!.height, MashwarSpace.primaryCta);
    }
    expect(mashwarTheme(dark: true).scaffoldBackgroundColor, MashwarColors.navy);
  });

  test('strings switch with the locale', () {
    expect(const MashwarStrings(Locale('ar')).brand, 'مَشوار');
    expect(const MashwarStrings(Locale('en')).brand, 'MASHWAR');
  });
}
