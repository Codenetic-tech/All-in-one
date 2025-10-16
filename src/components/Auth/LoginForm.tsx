import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { Loader2, Eye, EyeOff, User, Lock, Sparkles, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';

interface LoginError {
  message?: string;
}

const LoginForm = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  
  const { login } = useAuth();
  const { toast } = useToast();

  // Track mouse movement for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(employeeId, password);
      toast({
        title: "✨ Welcome Back!",
        description: "Successfully authenticated. Redirecting to dashboard...",
      });
    } catch (err: unknown) {
      console.error('Login error:', err);
      
      let errorMessage = 'Authentication failed. Please verify your credentials.';
      
      if (err && typeof err === 'object' && 'message' in err) {
        const loginError = err as LoginError;
        errorMessage = loginError.message || errorMessage;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Authenticating your credentials..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden flex items-center justify-center">
      {/* Dynamic Background with Mesh Gradient */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x / window.innerWidth * 100}% ${mousePosition.y / window.innerHeight * 100}%, 
            rgba(59, 130, 246, 0.15) 0%, 
            rgba(139, 92, 246, 0.1) 25%, 
            rgba(16, 185, 129, 0.05) 50%, 
            transparent 100%)`
        }}
      />
      
      {/* Animated Dot Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.15)_1px,transparent_0)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_40%,transparent_100%)]" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-80 h-80 bg-gradient-to-r from-purple-200/25 to-pink-200/25 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-16 w-48 h-48 bg-gradient-to-r from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl animate-pulse delay-2000" />

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        <Card 
          className="bg-white/80 backdrop-blur-2xl border-0 shadow-2xl shadow-blue-500/10 transition-all duration-500 hover:shadow-3xl hover:shadow-purple-500/15 hover:bg-white/90"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Subtle Border Glow */}
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-emerald-500/20 p-[1px] transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-full h-full rounded-2xl bg-white/90" />
          </div>
          
          <CardHeader className="text-center relative z-10 pt-2 pb-2">
            {/* Enhanced Logo */}
            <div className="mx-auto w-26 h-22 flex items-center justify-center relative group">
              <img 
                src="/lovable-uploads/e80701e6-7295-455c-a88c-e3c4a1baad9b.png" 
                alt="GoPocket Logo" 
                className="w-40 h-40 object-contain relative z-10 filter"
              />
              <div className="absolute -top-1 -right-1">
                <div className=" flex items-center justify-center shadow-lg">
                </div>
              </div>
            </div>

            <CardTitle className="text-3xl font-bold mb-6">
              <span className="text-gray-900">
                Welcome Back
              </span>
            </CardTitle>
            
            <CardDescription className="text-gray-600 text-lg pb-8 font-medium">
              Sign in to your <span className="text-blue-600 font-semibold">GoPocket All in One APP</span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-8 pb-6 relative z-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Employee ID Field */}
              <div className="space-y-3">
                <Label htmlFor="employeeId" className="text-gray-700 text-sm font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600" />
                  Employee ID
                </Label>
                <div className="relative group">
                  <Input
                    id="employeeId"
                    type="text"
                    placeholder="Enter your employee ID"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    disabled={isLoading}
                    required
                    className="h-14 bg-gray-50/50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-500 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-base font-medium hover:border-gray-300 hover:bg-gray-50"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-3">
                <Label htmlFor="password" className="text-gray-700 text-sm font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-600" />
                  Password
                </Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="h-14 bg-gray-50/50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-500 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-base font-medium hover:border-gray-300 hover:bg-gray-50 pr-14"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group relative overflow-hidden shadow-md" 
                disabled={isLoading || !employeeId || !password}
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Signing you in...
                  </>
                ) : (
                  <>
                    Sign In to Dashboard
                    <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
            {/* Features Row */}
            <div className="mt-8 pt-6 border-t border-gray-200/60">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-emerald-600">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Secure</div>
                    <div className="text-xs text-gray-500">256-bit SSL</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Fast</div>
                    <div className="text-xs text-gray-500">Instant Access</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Bar */}
        <div className="mt-6 bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium">All Systems Online</span>
            </div>
            <div className="text-gray-500">
              <span className="font-medium">99.9%</span> Uptime
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 text-blue-200">
        <div className="w-32 h-32 border-2 border-current rounded-full opacity-20 animate-spin" style={{ animationDuration: '20s' }} />
        <div className="absolute top-4 left-4 w-24 h-24 border-2 border-current rounded-full opacity-40 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-sm text-gray-500 font-medium">
          © 2025 GoPocket HRMS • <span className="text-blue-600">Powering Modern Workplaces</span>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;