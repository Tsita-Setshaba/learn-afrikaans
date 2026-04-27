import requests
import sys
import json
from datetime import datetime

class LearnAfrikaansAPITester:
    def __init__(self, base_url="https://night-theme-app-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    self.log_test(name, True, f"Status: {response.status_code}")
                    return True, response_data
                except:
                    self.log_test(name, True, f"Status: {response.status_code} (No JSON response)")
                    return True, {}
            else:
                try:
                    error_data = response.json()
                    self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}. Error: {error_data}")
                except:
                    self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}. Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_user_registration(self):
        """Test user registration with 3-step onboarding data"""
        test_user_data = {
            "name": "Test User",
            "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "password123",
            "interface_language": "en",
            "skill_level": "beginner"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response.get('user', {}).get('id')
            return True
        return False

    def test_user_login(self):
        """Test user login with provided credentials"""
        login_data = {
            "email": "test@example.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            # Store token for subsequent tests
            backup_token = self.token
            self.token = response['token']
            
            # Test with the new token
            auth_success, _ = self.run_test("Auth Token Validation", "GET", "auth/me", 200)
            
            # Restore original token if we had one
            if backup_token:
                self.token = backup_token
            
            return auth_success
        return False

    def test_dashboard_api(self):
        """Test dashboard API endpoint"""
        return self.run_test("Dashboard API", "GET", "dashboard", 200)

    def test_lessons_topics(self):
        """Test lessons topics API"""
        success, response = self.run_test("Lessons Topics", "GET", "lessons/topics", 200)
        
        if success and isinstance(response, list):
            self.log_test("Topics Data Structure", len(response) > 0, f"Found {len(response)} topics")
            return True
        return False

    def test_lesson_detail(self):
        """Test individual lesson detail"""
        # Test with a known topic ID
        return self.run_test("Lesson Detail", "GET", "lessons/greetings", 200)

    def test_quiz_generation(self):
        """Test quiz generation"""
        quiz_data = {
            "topic_id": "greetings",
            "skill_level": "beginner"
        }
        
        success, response = self.run_test(
            "Quiz Generation",
            "POST",
            "quiz/generate",
            200,
            data=quiz_data
        )
        
        if success and 'questions' in response:
            questions = response['questions']
            self.log_test("Quiz Questions Generated", len(questions) > 0, f"Generated {len(questions)} questions")
            return True
        return False

    def test_chatbot_message(self):
        """Test chatbot message API"""
        message_data = {
            "message": "Hello, how do I say hello in Afrikaans?",
            "skill_level": "beginner"
        }
        
        success, response = self.run_test(
            "Chatbot Message",
            "POST",
            "chatbot/message",
            200,
            data=message_data
        )
        
        if success and 'response' in response:
            self.log_test("Chatbot Response", len(response['response']) > 0, "Got chatbot response")
            return True
        return False

    def test_leaderboard(self):
        """Test leaderboard API"""
        success, response = self.run_test("Leaderboard", "GET", "leaderboard", 200)
        
        if success and 'all_time' in response and 'weekly' in response:
            self.log_test("Leaderboard Structure", True, "All-time and weekly leaderboards present")
            return True
        return False

    def test_word_of_day(self):
        """Test word of the day API"""
        success, response = self.run_test("Word of Day", "GET", "word-of-day", 200)
        
        if success and 'afrikaans' in response and 'english' in response:
            self.log_test("Word of Day Structure", True, f"Word: {response.get('afrikaans', 'N/A')}")
            return True
        return False

    def test_badges(self):
        """Test badges API"""
        return self.run_test("Badges API", "GET", "badges", 200)

    def test_progress(self):
        """Test progress API"""
        return self.run_test("Progress API", "GET", "progress", 200)

    def test_streak_update(self):
        """Test streak update"""
        return self.run_test("Streak Update", "POST", "users/update-streak", 200)

    def test_lesson_completion(self):
        """Test lesson completion"""
        return self.run_test("Lesson Completion", "POST", "lessons/greetings/complete", 200)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting LearnAfrikaans API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)

        # Test basic connectivity
        self.test_root_endpoint()
        
        # Test authentication flow
        print("\n📝 Testing Authentication...")
        if self.test_user_registration():
            print("✅ Registration successful, proceeding with authenticated tests...")
            
            # Test core APIs that require authentication
            print("\n📊 Testing Dashboard & User APIs...")
            self.test_dashboard_api()
            self.test_progress()
            self.test_streak_update()
            
            print("\n📚 Testing Lessons APIs...")
            self.test_lessons_topics()
            self.test_lesson_detail()
            self.test_lesson_completion()
            
            print("\n🎯 Testing Quiz APIs...")
            self.test_quiz_generation()
            
            print("\n🤖 Testing Chatbot APIs...")
            self.test_chatbot_message()
            
            print("\n🏆 Testing Leaderboard & Social APIs...")
            self.test_leaderboard()
            self.test_badges()
            
            print("\n📅 Testing Content APIs...")
            self.test_word_of_day()
            
        else:
            print("❌ Registration failed, testing public endpoints only...")
            self.test_word_of_day()
        
        # Test login with provided credentials
        print("\n🔐 Testing Login with provided credentials...")
        self.test_user_login()

        # Print final results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            print("\nFailed tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
            return 1

def main():
    tester = LearnAfrikaansAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())