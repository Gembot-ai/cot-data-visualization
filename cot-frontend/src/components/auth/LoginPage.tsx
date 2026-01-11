import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (password: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onLogin(password);
    } else {
      setError('Please enter a password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-eccuity-light-100">
      <div className="glass-strong p-10 rounded-2xl shadow-glass w-full max-w-md border-eccuity-coral/10">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/images/eccuity-logo.svg" alt="Eccuity" className="h-16 w-16 mb-4" />
          <h1 className="text-4xl font-bold text-eccuity-dark-300 mb-3">
            CoT Dashboard
          </h1>
          <p className="text-eccuity-light-400 text-sm font-medium">Commitment of Traders Analysis</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-eccuity-dark-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter dashboard password"
              className="w-full px-4 py-3 rounded-xl border-2 border-eccuity-light-300 bg-white text-eccuity-dark-300 placeholder-eccuity-light-400 focus:ring-2 focus:ring-eccuity-coral focus:border-eccuity-coral outline-none transition-all shadow-sm"
              autoFocus
            />
            {error && (
              <p className="text-eccuity-coral text-sm mt-2 font-medium">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-eccuity-coral hover:bg-eccuity-coral/90 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl"
          >
            Access Dashboard
          </button>
        </form>

        <p className="text-center text-eccuity-light-400 text-xs mt-8">
          CFTC Weekly Reports • Trading Analysis
        </p>
      </div>
    </div>
  );
};
