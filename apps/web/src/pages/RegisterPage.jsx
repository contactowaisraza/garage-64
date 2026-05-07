
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import PaymentModal from '@/components/PaymentModal.jsx';
import apiServerClient from '@/lib/apiServerClient';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[\u0621-\u064a a-zA-Z0-9_ ]+$/;

const tierOptions = [
  { value: 'observer', label: 'Observer' },
  { value: 'hobbyist', label: 'Hobbyist' },
  { value: 'collector', label: 'Collector' },
  { value: 'dealer', label: 'Dealer' }
];

const RegisterPage = () => {
  const { isRTL, td } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState('observer');
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    password: '',
    passwordConfirm: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleTierChange = (value) => {
    setSelectedTier(value);
  };

  const handleObserverSignup = async () => {
    setLoading(true);
    try {
      const res = await apiServerClient.fetch('/auth/signup-observer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone
        })
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || (isRTL ? 'فشل إنشاء الحساب. حاول مرة أخرى.' : 'Account creation failed. Try again.'));
      }

      await login(formData.email, formData.password);
      toast.success(isRTL ? 'تم التسجيل بنجاح' : 'Registration successful');
      navigate('/profile');

    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.message || (isRTL ? 'خطأ في الاتصال. تحقق من الاتصال.' : 'Network error. Check connection.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!EMAIL_REGEX.test(formData.email)) return toast.error(isRTL ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email');
    if (!NAME_REGEX.test(formData.name)) return toast.error(isRTL ? 'تنسيق الاسم غير صالح' : 'Invalid name format');
    if (!formData.phone || formData.phone.trim().length < 10) return toast.error(isRTL ? 'يرجى إدخال رقم هاتف صحيح (10 أرقام على الأقل)' : 'Please enter a valid phone number (at least 10 digits)');
    if (formData.password.length < 8) return toast.error(isRTL ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
    if (formData.password !== formData.passwordConfirm) return toast.error(isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');

    if (!selectedTier) {
      return toast.error(isRTL ? 'الرجاء اختيار الباقة' : 'Please select a tier');
    }

    if (selectedTier === 'observer') {
      handleObserverSignup();
    } else {
      setShowPaymentModal(true);
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${isRTL ? 'إنشاء حساب' : 'Register'} - Garage 64`}</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <Card className="w-full max-w-xl shadow-2xl bg-card border border-border">
            <CardHeader className="text-center space-y-2 pb-8">
              <CardTitle className="text-3xl font-bold text-foreground">
                {isRTL ? 'إنشاء حساب جديد' : 'Create an Account'}
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                {isRTL ? 'انضم إلى مجتمعنا اليوم' : 'Join our community today'}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">{isRTL ? 'الاسم الكامل' : 'Full Name'}</Label>
                  <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required className="bg-background text-foreground" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    required 
                    placeholder="+1 (555) 123-4567"
                    className="bg-background text-foreground" 
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">{isRTL ? 'البريد الإلكتروني' : 'Email Address'}</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className="bg-background text-foreground" dir="ltr" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tier" className="text-foreground">{isRTL ? 'اختر الباقة' : 'Select Tier'}</Label>
                  <Select value={selectedTier} onValueChange={handleTierChange} required>
                    <SelectTrigger className="w-full bg-background text-foreground h-12">
                      <SelectValue placeholder="Select a membership tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {tierOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {td(option.value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground">{isRTL ? 'كلمة المرور' : 'Password'}</Label>
                    <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required minLength={8} className="bg-background text-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordConfirm" className="text-foreground">{isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Label>
                    <Input id="passwordConfirm" name="passwordConfirm" type="password" value={formData.passwordConfirm} onChange={handleChange} required minLength={8} className="bg-background text-foreground" />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-lg font-medium mt-4 bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
                  {loading ? (
                    isRTL ? 'جاري الإنشاء...' : 'Creating account...'
                  ) : (
                    selectedTier === 'observer' ? (isRTL ? 'إنشاء حساب' : 'Sign Up') : (isRTL ? 'المتابعة للدفع' : 'Continue to Payment')
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center text-sm">
                <span className="text-muted-foreground">{isRTL ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}</span>
                <Link to="/login" className="text-primary font-medium hover:underline">
                  {isRTL ? 'تسجيل الدخول' : 'Log in'}
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>

      {showPaymentModal && (
        <PaymentModal
          isSignUp={true}
          userData={{ ...formData, tier: selectedTier }}
          showModal={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => navigate('/pending-approval')}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
};

export default RegisterPage;
