import 'package:flutter/painting.dart';

/// Colour, radius and spacing tokens. Values are copied from DESIGN_SYSTEM.md sections 1-4 and
/// must stay in sync with the React prototype (prototype/src/index.css).
abstract final class MashwarColors {
  static const navy = Color(0xFF101B2E);
  static const navy2 = Color(0xFF17243B);
  static const emerald = Color(0xFF0FAF92);
  static const emeraldDark = Color(0xFF0B8F77);
  static const mint = Color(0xFFE6F8F2);
  static const gold = Color(0xFFD7A867);
  static const ink = Color(0xFF182335);
  static const muted = Color(0xFF718096);
  static const line = Color(0xFFE7EBF1);
  static const bg = Color(0xFFF6F8FB);

  // Ride status colours (always paired with a text label, never colour alone).
  static const statusRequested = Color(0xFFE3A13A);
  static const statusEnRoute = gold;
  static const statusActive = Color(0xFF3B82F6);
  static const statusCompleted = emerald;
  static const statusCancelled = Color(0xFFE25B53);
}

abstract final class MashwarRadius {
  static const sm = 10.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const sheet = 28.0;
}

abstract final class MashwarSpace {
  static const gutter = 20.0; // mobile screen gutter
  static const minTouch = 44.0;
  static const primaryCta = 56.0;
}
