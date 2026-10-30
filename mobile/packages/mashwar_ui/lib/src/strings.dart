import 'package:flutter/widgets.dart';

/// Arabic is the default locale; English is the second language.
const supportedLocales = [Locale('ar'), Locale('en')];

/// Shared strings for the foundation screens. Phase 2 moves app copy to ARB files
/// (flutter gen-l10n) using the same keys as prototype/src/i18n/messages.ts.
class MashwarStrings {
  const MashwarStrings(this.locale);

  final Locale locale;

  bool get isArabic => locale.languageCode == 'ar';

  String _t(String ar, String en) => isArabic ? ar : en;

  String get brand => _t('مَشوار', 'MASHWAR');
  String get riderApp => _t('تطبيق الراكب', 'Rider app');
  String get captainApp => _t('تطبيق الكابتن', 'Captain app');
  String get foundationNotice => _t(
        'هذا هيكل المرحلة الأولى. تسجيل الدخول والخرائط والحجز تُبنى في المرحلة الثانية.',
        'This is the Phase 1 foundation. Sign-in, maps and booking are built in Phase 2.',
      );
  String get switchLanguage => isArabic ? 'English' : 'العربية';
}
