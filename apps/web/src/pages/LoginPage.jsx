
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const LoginPage = () => {
  const { t, isRTL } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const authData = await login(formData.email, formData.password);
      toast.success(t('auth.loginButton'));
      
      if (authData.record.is_admin === true) {
        navigate('/admin-dashboard');
      } else if (authData.record.pending_tier_request) {
        navigate('/pending-approval');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <Helmet>
        <title>{`${t('auth.loginTitle')} - ${t('brand.name')}`}</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 flex items-center justify-center px-4 py-12 mt-24">
          <Card className="w-full max-w-md bg-card border-white/10">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                {t('auth.loginTitle')}
              </CardTitle>
              <CardDescription className="text-muted-foreground">{t('brand.tagline')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="bg-input border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-primary"
                    placeholder={t('auth.email')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">{t('auth.password')}</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="bg-input border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-primary"
                    placeholder={t('auth.password')}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wide" 
                  disabled={loading}
                >
                  {loading ? t('common.loading') : t('auth.loginButton')}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">{t('auth.noAccount')} </span>
                <Link to="/register" className="text-primary font-medium hover:underline">
                  {t('auth.registerLink')}
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default LoginPage;
