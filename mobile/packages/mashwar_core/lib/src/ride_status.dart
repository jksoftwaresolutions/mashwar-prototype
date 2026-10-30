/// Trip states from docs/phase1/04-trip-lifecycle-spec.md.
///
/// The server is authoritative: the apps use these rules only to decide which actions to offer.
/// The table mirrors backend/src/trips/domain/trip-state-machine.ts and ride.trip_status_transitions.
enum RideStatus {
  requested,
  accepted,
  arrived,
  inProgress,
  completed,
  cancelled,
  expired;

  bool get isTerminal => this == completed || this == cancelled || this == expired;

  /// Wire value used by the API and the database (`in_progress`, not `inProgress`).
  String get wire => this == inProgress ? 'in_progress' : name;

  static RideStatus fromWire(String value) =>
      RideStatus.values.firstWhere((s) => s.wire == value, orElse: () => throw ArgumentError.value(value, 'value', 'unknown ride status'));
}

enum TripActor { rider, captain, system, admin }

const Map<(RideStatus, RideStatus), Set<TripActor>> _transitions = {
  (RideStatus.requested, RideStatus.accepted): {TripActor.captain},
  (RideStatus.requested, RideStatus.cancelled): {TripActor.rider, TripActor.admin},
  (RideStatus.requested, RideStatus.expired): {TripActor.system},
  (RideStatus.accepted, RideStatus.arrived): {TripActor.captain},
  (RideStatus.accepted, RideStatus.requested): {TripActor.captain, TripActor.system},
  (RideStatus.accepted, RideStatus.cancelled): {TripActor.rider, TripActor.admin},
  (RideStatus.arrived, RideStatus.inProgress): {TripActor.captain},
  (RideStatus.arrived, RideStatus.cancelled): {TripActor.rider, TripActor.captain, TripActor.admin},
  (RideStatus.inProgress, RideStatus.completed): {TripActor.captain},
  (RideStatus.inProgress, RideStatus.cancelled): {TripActor.admin},
};

bool canTransition(RideStatus from, RideStatus to, TripActor actor) =>
    !from.isTerminal && (_transitions[(from, to)]?.contains(actor) ?? false);

/// Actions to show a given actor; for example the captain sees "Arrived" only while `accepted`.
List<RideStatus> nextStatuses(RideStatus from, TripActor actor) => [
      for (final MapEntry(key: (f, to), value: actors) in _transitions.entries)
        if (f == from && actors.contains(actor) && !from.isTerminal) to,
    ];

/// Applies a server event only if it is newer than what the app holds (out-of-order and duplicate
/// events are ignored; a gap means the app should re-fetch the trip).
enum EventDecision { apply, ignore, resync }

EventDecision decideEvent({required int currentVersion, required int eventVersion}) {
  if (eventVersion <= currentVersion) return EventDecision.ignore;
  if (eventVersion == currentVersion + 1) return EventDecision.apply;
  return EventDecision.resync;
}
