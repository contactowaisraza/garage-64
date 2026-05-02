
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { useLanguage } from '@/hooks/useLanguage';

const ProfileEditModal = ({ isOpen, onClose, user, onSuccess }) => {
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '' 
  });
  const [avatarFile, setAvatarFile] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('phone', formData.phone);
      data.append('bio', formData.bio);
      
      // Only append email if it changed, as PB might handle it differently
      if (formData.email !== user.email) {
        data.append('email', formData.email);
      }
      
      if (avatarFile) {
        data.append('avatar', avatarFile);
      }

      await pb.collection('users').update(user.id, data, { $autoCancel: false });
      
      if (formData.email !== user.email) {
        toast.info(isRTL ? 'تم تحديث الملف الشخصي. قد تحتاج لتأكيد بريدك الإلكتروني الجديد.' : 'Profile updated. You may need to verify your new email.');
      } else {
        toast.success(isRTL ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully');
      }
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      toast.error(isRTL ? 'فشل في تحديث الملف الشخصي' : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-white/10 text-foreground" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile'}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isRTL ? 'قم بتحديث معلوماتك الشخصية هنا.' : 'Update your personal information here.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="avatar">{isRTL ? 'الصورة الشخصية' : 'Profile Picture'}</Label>
            <Input 
              id="avatar" 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="bg-input border-white/10 cursor-pointer text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{isRTL ? 'الاسم الكامل' : 'Full Name'}</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                className="bg-input border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</Label>
              <Input 
                id="phone" 
                name="phone" 
                type="tel"
                value={formData.phone} 
                onChange={handleChange} 
                className="bg-input border-white/10 text-white"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{isRTL ? 'البريد الإلكتروني' : 'Email Address'}</Label>
            <Input 
              id="email" 
              name="email" 
              type="email"
              value={formData.email} 
              onChange={handleChange} 
              required 
              className="bg-input border-white/10 text-white"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">{isRTL ? 'نبذة عنك' : 'Bio'}</Label>
            <Textarea 
              id="bio" 
              name="bio" 
              value={formData.bio} 
              onChange={handleChange} 
              className="bg-input border-white/10 text-white min-h-[100px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="bg-transparent border-white/20 text-white hover:bg-white/10">
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
              {loading ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ التغييرات' : 'Save Changes')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditModal;
