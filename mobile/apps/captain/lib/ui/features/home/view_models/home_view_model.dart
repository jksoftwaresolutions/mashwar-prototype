import 'package:flutter/widgets.dart';
import 'package:mashwar_ui/mashwar_ui.dart';

/// Holds the UI language. Arabic by default (RTL); the server-side profile preference
/// replaces this in Phase 2.
class HomeViewModel extends ChangeNotifier {
  Locale _locale = supportedLocales.first;

  Locale get locale => _locale;
  MashwarStrings get strings => MashwarStrings(_locale);

  void toggleLanguage() {
    _locale = _locale.languageCode == 'ar' ? const Locale('en') : const Locale('ar');
    notifyListeners();
  }
}
