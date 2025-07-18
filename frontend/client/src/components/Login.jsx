import React, { useState } from 'react';
    import axios from 'axios';

    function Login({ setIsAuthenticated }) {
      const [isLogin, setIsLogin] = useState(true);
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [confirmPassword, setConfirmPassword] = useState('');
      const [name, setName] = useState('');
      const [message, setMessage] = useState('');

      const handleLogin = async () => {
        try {
          const response = await axios.post('http://localhost:3000/api/v1/login', { email, password });
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setIsAuthenticated(true);
          setMessage('');
        } catch (error) {
          console.error('Login failed:', error);
          setMessage('Login failed. Please check your credentials.');
        }
      };

      const handleRegister = async () => {
        if (password !== confirmPassword) {
          setMessage('Passwords do not match!');
          return;
        }
        
        try {
          await axios.post('http://localhost:3000/api/v1/register', { email, password, name });
          setMessage('Registration successful! You can now log in.');
          setIsLogin(true);
          setPassword('');
          setConfirmPassword('');
          setName('');
        } catch (error) {
          console.error('Registration failed:', error);
          setMessage('Registration failed. Email might already exist.');
        }
      };

      const handleSubmit = (e) => {
        e.preventDefault();
        if (isLogin) {
          handleLogin();
        } else {
          handleRegister();
        }
      };

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                {isLogin ? 'Sign in to your account' : 'Create new account'}
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setMessage('');
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                    setName('');
                  }}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  {isLogin ? 'Register here' : 'Sign in here'}
                </button>
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  />
                </div>
                {!isLogin && (
                  <div>
          <input
            type="text"
                      required
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    />
                  </div>
                )}
                <div>
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  />
                </div>
                {!isLogin && (
                  <div>
                    <input
                      type="password"
                      required
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
          />
                  </div>
                )}
                {isLogin && (
                  <div>
          <input
            type="password"
                      required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    />
                  </div>
                )}
              </div>

              {message && (
                <div className={`text-sm text-center p-2 rounded ${message.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {message}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isLogin ? 'Sign in' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    export default Login;