import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle, RefreshCw } from "lucide-react";

const EmailVerification = () => {
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [email] = useState("user@example.com"); // This would come from signup flow

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    // Simulate verification process
    setTimeout(() => {
      setIsVerifying(false);
      // Redirect to home page after successful verification with signed in state
      navigate("/", { state: { isSignedIn: true } });
    }, 2000);
  };

  const handleResendCode = () => {
    setCountdown(60);
    setCanResend(false);
    // Simulate resending code
    console.log("Resending verification code...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/auth")}
          className="mb-6 text-gray-600 hover:text-purple-600"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sign Up
        </Button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
            G
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Verify Your Email
          </h1>
          <p className="text-gray-600 mt-2">
            We've sent a verification code to your email
          </p>
        </div>

        {/* Verification Card */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-purple-100">
          <CardHeader className="text-center">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-800">
              Check Your Email
            </CardTitle>
            <CardDescription>
              We sent a 6-digit verification code to
              <br />
              <span className="font-semibold text-purple-600">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerification} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="text-center text-lg font-mono tracking-widest border-purple-200 focus:border-purple-400"
                  maxLength={6}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={verificationCode.length !== 6 || isVerifying}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 font-semibold"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Email
                  </>
                )}
              </Button>
            </form>

            {/* Resend Code */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-3">
                Didn't receive the code?
              </p>
              {canResend ? (
                <Button
                  variant="link"
                  onClick={handleResendCode}
                  className="text-purple-600 hover:text-purple-700 p-0 font-semibold"
                >
                  Resend Code
                </Button>
              ) : (
                <p className="text-sm text-gray-500">
                  Resend code in {countdown}s
                </p>
              )}
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-start space-x-2">
                <Mail className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-purple-700">
                  <p className="font-semibold mb-1">Can't find the email?</p>
                  <ul className="text-xs space-y-1 text-purple-600">
                    <li>• Check your spam/junk folder</li>
                    <li>• Make sure you entered the correct email</li>
                    <li>• Wait a few minutes for delivery</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 This helps us keep your account secure and ensures you never miss
            important opportunities
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
