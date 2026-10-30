import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mashwar_rider/ui/features/home/view_models/home_view_model.dart';

void main() {
  test('starts in Arabic and toggles to English and back', () {
    final vm = HomeViewModel();
    var notified = 0;
    vm.addListener(() => notified++);
    expect(vm.locale, const Locale('ar'));
    vm.toggleLanguage();
    expect(vm.locale, const Locale('en'));
    vm.toggleLanguage();
    expect(vm.locale, const Locale('ar'));
    expect(notified, 2);
  });
}
