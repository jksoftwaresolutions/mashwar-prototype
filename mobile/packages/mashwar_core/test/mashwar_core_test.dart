import 'dart:io';

import 'package:mashwar_core/mashwar_core.dart';
import 'package:test/test.dart';

void main() {
  group('ride status rules', () {
    test('happy path is the captain\'s to drive', () {
      expect(canTransition(RideStatus.requested, RideStatus.accepted, TripActor.captain), isTrue);
      expect(canTransition(RideStatus.accepted, RideStatus.arrived, TripActor.captain), isTrue);
      expect(canTransition(RideStatus.arrived, RideStatus.inProgress, TripActor.captain), isTrue);
      expect(canTransition(RideStatus.inProgress, RideStatus.completed, TripActor.captain), isTrue);
    });

    test('riders cannot cancel a trip in progress; admins can', () {
      expect(canTransition(RideStatus.inProgress, RideStatus.cancelled, TripActor.rider), isFalse);
      expect(canTransition(RideStatus.inProgress, RideStatus.cancelled, TripActor.admin), isTrue);
    });

    test('terminal states offer no actions', () {
      for (final s in [RideStatus.completed, RideStatus.cancelled, RideStatus.expired]) {
        for (final actor in TripActor.values) {
          expect(nextStatuses(s, actor), isEmpty);
        }
      }
    });

    test('wire values round-trip', () {
      for (final s in RideStatus.values) {
        expect(RideStatus.fromWire(s.wire), s);
      }
      expect(RideStatus.inProgress.wire, 'in_progress');
      expect(() => RideStatus.fromWire('teleported'), throwsArgumentError);
    });

    test('matches the backend transition table', () {
      final sql = File('../../../backend/db/migrations/0002_reference_data.sql').readAsStringSync();
      final start = sql.indexOf('insert into ride.trip_status_transitions');
      final block = sql.substring(start, sql.indexOf(';', start));
      final rows = RegExp(r"\('(\w+)',\s*'(\w+)',\s*'\{([\w,]+)\}'\)").allMatches(block).map((m) {
        final actors = m.group(3)!.split(',')..sort();
        return '${m.group(1)}>${m.group(2)}:${actors.join(',')}';
      }).toList()
        ..sort();
      final dart = <String>[];
      for (final from in RideStatus.values) {
        for (final to in RideStatus.values) {
          final actors = [for (final a in TripActor.values) if (canTransition(from, to, a)) a.name]..sort();
          if (actors.isNotEmpty) dart.add('${from.wire}>${to.wire}:${actors.join(',')}');
        }
      }
      dart.sort();
      expect(dart, rows);
    });
  });

  group('event ordering', () {
    test('ignores duplicates and old events, applies the next one, resyncs on gaps', () {
      expect(decideEvent(currentVersion: 3, eventVersion: 3), EventDecision.ignore);
      expect(decideEvent(currentVersion: 3, eventVersion: 2), EventDecision.ignore);
      expect(decideEvent(currentVersion: 3, eventVersion: 4), EventDecision.apply);
      expect(decideEvent(currentVersion: 3, eventVersion: 6), EventDecision.resync);
    });
  });

  group('money', () {
    test('formats halalas with Latin digits', () {
      expect(const Money(2700, 'SAR').format(arabic: false), 'SAR 27');
      expect(const Money(2750, 'SAR').format(arabic: true), '27.50 ر.س');
      expect(const Money(124000, 'SAR').format(arabic: false), 'SAR 1,240');
      expect(const Money(-50, 'SAR').format(arabic: false), 'SAR -0.50');
    });

    test('refuses to add different currencies', () {
      expect(const Money(100, 'SAR') + const Money(50, 'SAR'), const Money(150, 'SAR'));
      expect(() => const Money(100, 'SAR') + const Money(50, 'AED'), throwsArgumentError);
    });
  });
}
