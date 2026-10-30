import 'package:flutter/material.dart';
import 'package:mashwar_ui/mashwar_ui.dart';

import '../view_models/home_view_model.dart';

/// Phase 1 placeholder. The approved screens are in the React prototype (prototype/).
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key, required this.viewModel});

  final HomeViewModel viewModel;

  @override
  Widget build(BuildContext context) {
    final s = viewModel.strings;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(MashwarSpace.gutter),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(s.brand, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 4),
              Text(s.riderApp, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 24),
              Text(s.foundationNotice),
              const Spacer(),
              FilledButton(onPressed: viewModel.toggleLanguage, child: Text(s.switchLanguage)),
            ],
          ),
        ),
      ),
    );
  }
}
