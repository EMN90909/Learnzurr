import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import 'services/api_client.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: '.env');
  await Supabase.initialize(
    url: dotenv.env['SUPABASE_URL'] ?? 'https://placeholder.supabase.co',
    anonKey: dotenv.env['SUPABASE_ANON_KEY'] ?? 'placeholder',
  );
  runApp(const LearnzurrApp());
}

enum AppRole { teacher, learner, guardian, admin }

const rolePages = <AppRole, List<String>>{
  AppRole.teacher: ['Dashboard', 'Team', 'Classes', 'Assignments', 'Students', 'Payments', 'Reports', 'Settings'],
  AppRole.learner: ['Dashboard', 'My classes', 'Assignments', 'Lessons', 'Progress', 'Q&A', 'Calendar', 'Settings'],
  AppRole.guardian: ['Dashboard', 'Children', 'Classes', 'Progress', 'Payments', 'Teachers', 'Messages', 'Settings'],
  AppRole.admin: ['Dashboard', 'Users', 'Classes', 'Payments', 'Teacher teams', 'Reports', 'Content', 'Settings'],
};

final router = GoRouter(
  initialLocation: '/signin',
  redirect: (context, state) {
    final session = Supabase.instance.client.auth.currentSession;
    final authRoute = state.matchedLocation.startsWith('/signin') || state.matchedLocation.startsWith('/signup');
    if (session == null && !authRoute) return '/signin';
    return null;
  },
  routes: [
    GoRoute(path: '/signin', builder: (_, __) => const SignInPage()),
    GoRoute(path: '/signup/:role', builder: (_, state) => SignUpPage(role: AppRole.values.byName(state.pathParameters['role']!))),
    GoRoute(path: '/dashboard/:role', builder: (_, state) => DashboardShell(role: AppRole.values.byName(state.pathParameters['role']!))),
  ],
);

class LearnzurrApp extends StatelessWidget {
  const LearnzurrApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp.router(
    title: 'Learnzurr',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff39d8aa)),
      useMaterial3: true,
      scaffoldBackgroundColor: const Color(0xfff4f7fb),
      cardTheme: const CardThemeData(elevation: 0, margin: EdgeInsets.zero),
    ),
    routerConfig: router,
  );
}

class SignInPage extends StatefulWidget {
  const SignInPage({super.key});
  @override
  State<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  final email = TextEditingController();
  final password = TextEditingController();
  String message = '';
  bool busy = false;

  Future<void> submit() async {
    setState(() { busy = true; message = ''; });
    try {
      final response = await Supabase.instance.client.auth.signInWithPassword(email: email.text.trim(), password: password.text);
      final role = response.user?.userMetadata?['role']?.toString() ?? 'learner';
      if (mounted) context.go('/dashboard/$role');
    } on AuthException catch (error) {
      setState(() => message = error.message);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => AuthScaffold(
        title: 'Welcome back',
        subtitle: 'One secure sign-in for teachers, learners, guardians, and administrators.',
        child: Column(children: [
          AppField(controller: email, label: 'Email', keyboardType: TextInputType.emailAddress),
          AppField(controller: password, label: 'Password', obscure: true),
          FilledButton(onPressed: busy ? null : submit, child: Text(busy ? 'Signing in…' : 'Sign in')),
          if (message.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 12), child: Text(message, style: const TextStyle(color: Colors.red))),
          const SizedBox(height: 20),
          const Text('Create an account'),
          Wrap(spacing: 8, children: AppRole.values.map((role) => TextButton(onPressed: () => context.go('/signup/${role.name}'), child: Text(role.name))).toList()),
        ]),
      );
}

class SignUpPage extends StatefulWidget {
  const SignUpPage({super.key, required this.role});
  final AppRole role;
  @override
  State<SignUpPage> createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> {
  final name = TextEditingController();
  final email = TextEditingController();
  final password = TextEditingController();
  final extra = TextEditingController();
  String message = '';
  bool busy = false;

  String get extraLabel => switch (widget.role) {
        AppRole.teacher => 'School or team',
        AppRole.learner => 'Guardian phone',
        AppRole.guardian => 'Child name',
        AppRole.admin => 'Organisation',
      };

  Future<void> submit() async {
    setState(() { busy = true; message = ''; });
    try {
      await Supabase.instance.client.auth.signUp(
        email: email.text.trim(),
        password: password.text,
        emailRedirectTo: dotenv.env['EMAIL_REDIRECT_URL'],
        data: {'role': widget.role.name, 'full_name': name.text.trim(), 'extra': extra.text.trim()},
      );
      setState(() => message = 'Check your email and open the verification link before signing in.');
    } on AuthException catch (error) {
      setState(() => message = error.message);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => AuthScaffold(
        title: 'Create ${widget.role.name} account',
        subtitle: 'This role-specific signup requires email verification.',
        child: Column(children: [
          AppField(controller: name, label: 'Full name'),
          AppField(controller: email, label: 'Email', keyboardType: TextInputType.emailAddress),
          AppField(controller: extra, label: extraLabel),
          AppField(controller: password, label: 'Password', obscure: true),
          FilledButton(onPressed: busy ? null : submit, child: Text(busy ? 'Creating…' : 'Create account')),
          if (message.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 12), child: Text(message)),
          TextButton(onPressed: () => context.go('/signin'), child: const Text('Back to sign in')),
        ]),
      );
}

class DashboardShell extends StatefulWidget {
  const DashboardShell({super.key, required this.role});
  final AppRole role;
  @override
  State<DashboardShell> createState() => _DashboardShellState();
}

class _DashboardShellState extends State<DashboardShell> {
  int index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = rolePages[widget.role]!;
    final compact = MediaQuery.sizeOf(context).width < 760;
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.role.name.toUpperCase()} · ${pages[index]}'),
        actions: [IconButton(onPressed: () async { await Supabase.instance.client.auth.signOut(); if (context.mounted) context.go('/signin'); }, icon: const Icon(Icons.logout))],
      ),
      body: Row(children: [
        NavigationRail(
          extended: !compact,
          selectedIndex: index,
          onDestinationSelected: (value) => setState(() => index = value),
          leading: const Padding(padding: EdgeInsets.all(16), child: CircleAvatar(child: Text('L'))),
          destinations: pages.map((page) => NavigationRailDestination(icon: const Icon(Icons.circle_outlined), selectedIcon: const Icon(Icons.circle), label: Text(page))).toList(),
        ),
        const VerticalDivider(width: 1),
        Expanded(child: DashboardPage(role: widget.role, title: pages[index])),
      ]),
    );
  }
}

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key, required this.role, required this.title});
  final AppRole role;
  final String title;
  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  late Future<Map<String, dynamic>> health;
  bool actionBusy = false;

  @override
  void initState() {
    super.initState();
    health = apiClient.health();
  }

  Future<void> runAction() async {
    setState(() => actionBusy = true);
    try {
      if (widget.title == 'Payments') {
        final user = Supabase.instance.client.auth.currentUser;
        final result = await apiClient.initializePayment(email: user?.email ?? '', amount: 1500);
        final url = Uri.tryParse(result['authorizationUrl']?.toString() ?? '');
        if (url == null || !await launchUrl(url, mode: LaunchMode.externalApplication)) {
          throw const ApiException('Could not open Paystack checkout');
        }
      } else if (widget.role == AppRole.teacher && widget.title == 'Team') {
        await showDialog<void>(context: context, builder: (_) => const TeacherInviteDialog());
      } else {
        final result = await apiClient.health();
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Backend ${result['ok'] == true ? 'connected' : 'unavailable'}')));
      }
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) setState(() => actionBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) => RefreshIndicator(
        onRefresh: () async => setState(() => health = apiClient.health()),
        child: ListView(padding: const EdgeInsets.all(20), children: [
          Text(widget.title, style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          FutureBuilder<Map<String, dynamic>>(
            future: health,
            builder: (_, snapshot) => Chip(
              avatar: Icon(snapshot.hasData ? Icons.cloud_done : snapshot.hasError ? Icons.cloud_off : Icons.sync, size: 18),
              label: Text(snapshot.hasData ? 'Express backend connected' : snapshot.hasError ? 'Backend unavailable' : 'Checking backend…'),
            ),
          ),
          const SizedBox(height: 18),
          const Wrap(spacing: 12, runSpacing: 12, children: [
            MetricCard(label: 'Active learners', value: '128', detail: '+12 this month'),
            MetricCard(label: 'Completion', value: '84%', detail: 'Across active classes'),
            MetricCard(label: 'Revenue', value: 'KES 248k', detail: 'Paystack verified'),
          ]),
          const SizedBox(height: 18),
          Card(child: Padding(padding: const EdgeInsets.all(20), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${widget.title} workspace', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text('Native ${widget.role.name} workspace using Supabase authentication and the same Express API as the website.'),
            const SizedBox(height: 16),
            FilledButton.icon(onPressed: actionBusy ? null : runAction, icon: const Icon(Icons.sync_alt), label: Text(actionBusy ? 'Working…' : widget.title == 'Payments' ? 'Open Paystack checkout' : widget.title == 'Team' ? 'Invite teacher' : 'Test backend action')),
          ]))),
        ]),
      );
}

class TeacherInviteDialog extends StatefulWidget {
  const TeacherInviteDialog({super.key});
  @override
  State<TeacherInviteDialog> createState() => _TeacherInviteDialogState();
}

class _TeacherInviteDialogState extends State<TeacherInviteDialog> {
  final email = TextEditingController();
  final share = TextEditingController(text: '10');
  bool busy = false;

  Future<void> send() async {
    setState(() => busy = true);
    try {
      await apiClient.inviteTeacher(email: email.text.trim(), percentage: double.parse(share.text));
      if (mounted) Navigator.pop(context);
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
        title: const Text('Invite teacher'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          AppField(controller: email, label: 'Teacher email', keyboardType: TextInputType.emailAddress),
          AppField(controller: share, label: 'Revenue share (%)', keyboardType: TextInputType.number),
        ]),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')), FilledButton(onPressed: busy ? null : send, child: Text(busy ? 'Sending…' : 'Send invite'))],
      );
}

class MetricCard extends StatelessWidget {
  const MetricCard({super.key, required this.label, required this.value, required this.detail});
  final String label;
  final String value;
  final String detail;
  @override
  Widget build(BuildContext context) => SizedBox(width: 220, child: Card(child: Padding(padding: const EdgeInsets.all(18), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(label), const SizedBox(height: 8), Text(value, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)), Text(detail)]))));
}

class AuthScaffold extends StatelessWidget {
  const AuthScaffold({super.key, required this.title, required this.subtitle, required this.child});
  final String title;
  final String subtitle;
  final Widget child;
  @override
  Widget build(BuildContext context) => Scaffold(body: SafeArea(child: Center(child: SingleChildScrollView(padding: const EdgeInsets.all(24), child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 460), child: Card(child: Padding(padding: const EdgeInsets.all(28), child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [const CircleAvatar(radius: 26, child: Text('L')), const SizedBox(height: 20), Text(title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)), const SizedBox(height: 8), Text(subtitle, textAlign: TextAlign.center), const SizedBox(height: 28), child])))))));
}

class AppField extends StatelessWidget {
  const AppField({super.key, required this.controller, required this.label, this.obscure = false, this.keyboardType});
  final TextEditingController controller;
  final String label;
  final bool obscure;
  final TextInputType? keyboardType;
  @override
  Widget build(BuildContext context) => Padding(padding: const EdgeInsets.only(bottom: 14), child: TextField(controller: controller, obscureText: obscure, keyboardType: keyboardType, decoration: InputDecoration(labelText: label, border: const OutlineInputBorder())));
}
