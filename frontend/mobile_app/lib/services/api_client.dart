import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});
  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  String get _baseUrl => (dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:8081')
      .replaceAll(RegExp(r'/$'), '');

  Map<String, String> get _headers {
    final token = Supabase.instance.client.auth.currentSession?.accessToken;
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, dynamic>> health() => _request('GET', '/api/health');

  Future<Map<String, dynamic>> initializePayment({
    required String email,
    required double amount,
    String currency = 'KES',
  }) =>
      _request('POST', '/api/payments/initialize', body: {
        'email': email,
        'amount': amount,
        'currency': currency,
      });

  Future<Map<String, dynamic>> verifyPayment(String reference) =>
      _request('GET', '/api/payments/verify/${Uri.encodeComponent(reference)}');

  Future<Map<String, dynamic>> inviteTeacher({
    required String email,
    required double percentage,
  }) =>
      _request('POST', '/api/team/invite', body: {
        'email': email,
        'percentage': percentage,
      });

  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$_baseUrl$path');
    final response = method == 'POST'
        ? await _client.post(uri, headers: _headers, body: jsonEncode(body ?? const {}))
        : method == 'GET'
            ? await _client.get(uri, headers: _headers)
            : throw const ApiException('Unsupported request method');

    Map<String, dynamic> payload = const {};
    if (response.body.isNotEmpty) {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) payload = decoded;
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        payload['error']?.toString() ?? 'Backend request failed',
        statusCode: response.statusCode,
      );
    }

    return payload;
  }
}

final apiClient = ApiClient();
