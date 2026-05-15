import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');
  static String? _authToken;

  static void setAuthToken(String? token) {
    _authToken = token;
  }

  static Map<String, String> _buildHeaders(Map<String, String>? headers) {
    final merged = <String, String>{
      'Content-Type': 'application/json',
      ...?headers,
    };
    if (_authToken != null && _authToken!.isNotEmpty) {
      merged['Authorization'] = 'Bearer $_authToken';
    }
    return merged;
  }

  static Future<Map<String, dynamic>> getJson(String endpoint, {Map<String, String>? headers}) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final response = await http.get(url, headers: _buildHeaders(headers));
    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> postJson(
    String endpoint,
    Map<String, dynamic> data, {
    Map<String, String>? headers,
  }) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final response = await http.post(
      url,
      headers: _buildHeaders(headers),
      body: jsonEncode(data),
    );
    return _handleResponse(response);
  }

  static Future<dynamic> getData(String endpoint, {Map<String, String>? headers}) async {
    final payload = await getJson(endpoint, headers: headers);
    return payload['data'];
  }

  static Future<dynamic> postData(
    String endpoint,
    Map<String, dynamic> data, {
    Map<String, String>? headers,
  }) async {
    final payload = await postJson(endpoint, data, headers: headers);
    return payload['data'];
  }

  static Map<String, dynamic> _handleResponse(http.Response response) {
    final bodyText = response.body;
    dynamic decoded;
    if (bodyText.isNotEmpty) {
      decoded = jsonDecode(bodyText);
    } else {
      decoded = <String, dynamic>{};
    }

    if (decoded is! Map<String, dynamic>) {
      throw Exception('Unexpected response format');
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (decoded['success'] == false) {
        throw Exception(decoded['message'] ?? 'Request failed');
      }
      return decoded;
    }

    final message = decoded['message'] ?? 'Request failed';
    throw Exception(message);
  }
}