import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:mashwar_ui/mashwar_ui.dart';

import '../ui/features/home/view_models/home_view_model.dart';
import '../ui/features/home/views/home_screen.dart';

/// Composition root. Phase 2 adds go_router, the API client and repositories here (docs/phase1/08).
class MashwarCaptainApp extends StatefulWidget {
  const MashwarCaptainApp({super.key});

  @override
  State<MashwarCaptainApp> createState() => _MashwarCaptainAppState();
}

class _MashwarCaptainAppState extends State<MashwarCaptainApp> {
  final _home = HomeViewModel();

  @override
  void dispose() {
    _home.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _home,
      builder: (context, _) => MaterialApp(
        title: 'MASHWAR',
        debugShowCheckedModeBanner: false,
        theme: mashwarTheme(dark: true),
        locale: _home.locale,
        supportedLocales: supportedLocales,
        localizationsDelegates: GlobalMaterialLocalizations.delegates,
        home: HomeScreen(viewModel: _home),
      ),
    );
  }
}
