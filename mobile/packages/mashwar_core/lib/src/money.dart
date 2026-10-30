/// An amount in minor units (halalas for SAR). Amounts arrive from the server as integers;
/// the apps never compute fares, they only format what the server quoted.
class Money {
  const Money(this.minor, this.currency, {this.minorUnits = 2});

  final int minor;
  final String currency;
  final int minorUnits;

  /// Latin digits in both languages (DESIGN_SYSTEM.md section 9). Fractions shown only when non-zero.
  String format({required bool arabic, String symbolAr = 'ر.س', String? symbolEn}) {
    final scale = _pow10(minorUnits);
    final whole = minor.abs() ~/ scale;
    final frac = minor.abs() % scale;
    final grouped = whole.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ',');
    final value = '${minor < 0 ? '-' : ''}$grouped${frac == 0 ? '' : '.${frac.toString().padLeft(minorUnits, '0')}'}';
    return arabic ? '$value $symbolAr' : '${symbolEn ?? currency} $value';
  }

  Money operator +(Money other) {
    if (other.currency != currency) throw ArgumentError('currency mismatch: $currency vs ${other.currency}');
    return Money(minor + other.minor, currency, minorUnits: minorUnits);
  }

  @override
  bool operator ==(Object other) => other is Money && other.minor == minor && other.currency == currency;

  @override
  int get hashCode => Object.hash(minor, currency);

  static int _pow10(int n) => n == 0 ? 1 : 10 * _pow10(n - 1);
}
