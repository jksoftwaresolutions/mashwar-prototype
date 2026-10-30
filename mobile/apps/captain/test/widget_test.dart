import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mashwar_captain/app/app.dart';

void main() {
  testWidgets('opens right-to-left in Arabic and switches to English', (tester) async {
    await tester.pumpWidget(const MashwarCaptainApp());
    await tester.pumpAndSettle();

    expect(find.text('مَشوار'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('مَشوار'))), TextDirection.rtl);

    await tester.tap(find.text('English'));
    await tester.pumpAndSettle();

    expect(find.text('MASHWAR'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('MASHWAR'))), TextDirection.ltr);
  });
}
