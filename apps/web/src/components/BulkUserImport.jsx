
import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Download, UploadCloud, X, FileCheck, AlertCircle, Loader2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import pb from '@/lib/pocketbaseClient';
import { parseAndValidateUsers } from '@/utils/parseAndValidateUsers.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { calculateEndDate } from '@/utils/dateUtils.js';

const BulkUserImport = ({ onImportComplete }) => {
  const { isRTL } = useLanguage();
  const fileInputRef = useRef(null);
  
  const [textInput, setTextInput] = useState('');
  const [parsedResults, setParsedResults] = useState(null);
  const [rawUserData, setRawUserData] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const downloadTemplate = () => {
    const csvContent = "email,name,tier,password,phone\nuser@example.com,John Doe,Collector,SecurePass123,+964-123-456-7890";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "users_import_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(isRTL ? 'تم تحميل القالب' : 'Template downloaded');
  };

  const handleFileUpload = (uploadedFile) => {
    if (!uploadedFile) return;
    
    if (uploadedFile.size > 5 * 1024 * 1024) {
      toast.error(isRTL ? 'حجم الملف يتجاوز 5 ميغابايت' : 'File size exceeds 5MB');
      return;
    }

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log("results", results.data);
        setRawUserData(results.data);
        const validationResults = parseAndValidateUsers(results.data, 'csv', isRTL);
        setParsedResults(validationResults);
      },
      error: (error) => {
        toast.error(isRTL ? 'حدث خطأ أثناء قراءة الملف' : 'Error parsing file');
        console.error(error);
      }
    });
  };

  const handleTextProcess = () => {
    if (!textInput.trim()) return;
    const validationResults = parseAndValidateUsers(textInput, 'text', isRTL);
    
    // We can reconstruct the raw array from valid and invalid users for editing
    const reconstructedRaw = [...validationResults.validUsers, ...validationResults.invalidUsers]
      .sort((a, b) => a.rowNumber - b.rowNumber)
      .map(u => ({
        email: u.email || '',
        name: u.name || '',
        tier: u.tier || '',
        password: u.password || '',
        phone: u.phone || ''
      }));
    
    setRawUserData(reconstructedRaw);
    setParsedResults(validationResults);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const cancelImport = () => {
    setParsedResults(null);
    setTextInput('');
    setShowPasswords(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeImport = async () => {
    if (!parsedResults || parsedResults.invalidUsers.length > 0) return;
    
    setIsImporting(true);
    setProgress(0);
    
    let imported = 0;
    let failed = 0;
    let failedUsers = [];
    const total = parsedResults.validUsers.length;

    for (let i = 0; i < total; i++) {
      const user = parsedResults.validUsers[i];
      try {
        const usernameBase = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
        const randomSuffix = Math.floor(Math.random() * 10000);
        const generatedUsername = `${usernameBase}${randomSuffix}`;

        const payload = {
          email: user.email,
          name: user.name,
          username: generatedUsername,
          tier: user.tier?.toLowerCase() || 'observer',
          password: user.password,
          passwordConfirm: user.password,
          phone: user.phone || '0000000000',
          subscription_tier: user.tier?.toLowerCase() || 'observer',
          subscription_status: 'active',
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: calculateEndDate()
        };

        await pb.collection('users').create(payload, { $autoCancel: false });
        imported++;
      } catch (err) {
        console.error(`Error importing user ${user.email}:`, err);
        failed++;
        failedUsers.push({
          rowNumber: user.rowNumber,
          email: user.email,
          error: err.response?.message || err.message || 'Failed to create user'
        });
      }
      
      setProgress(Math.round(((i + 1) / total) * 100));
    }

    setImportResult({
      success: failed === 0,
      imported,
      skipped: 0,
      failed,
      failedUsers,
      skippedUsers: []
    });
    
    setShowResultModal(true);
    setIsImporting(false);
    
    if (imported > 0) {
      toast.success(isRTL ? `تم استيراد ${imported} مستخدم بنجاح` : `Successfully imported ${imported} users`);
      if (onImportComplete) onImportComplete();
    } 
    if (failed > 0) {
      toast.error(isRTL ? `فشل استيراد ${failed} مستخدم` : `Failed to import ${failed} users`);
    }
  };

  const downloadErrorReport = () => {
    if (!importResult || (!importResult.failedUsers.length && !importResult.skippedUsers.length)) return;
    
    const headers = "Row,Email,Status,Reason\n";
    const failedRows = importResult.failedUsers.map(u => `${u.rowNumber || '-'},${u.email || '-'},Failed,"${u.error || 'Unknown error'}"`).join("\n");
    const skippedRows = importResult.skippedUsers.map(u => `${u.rowNumber || '-'},${u.email || '-'},Skipped,"${u.reason || u.error || 'Skipped'}"`).join("\n");
    
    const csvContent = headers + failedRows + (failedRows && skippedRows ? "\n" : "") + skippedRows;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "import_error_report.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRetry = () => {
    if (!importResult || !parsedResults) return;
    
    const failedEmails = new Set(importResult.failedUsers.map(u => u.email));
    const usersToRetry = parsedResults.validUsers.filter(u => failedEmails.has(u.email));
    
    setParsedResults({
      validUsers: usersToRetry,
      invalidUsers: [],
      summary: {
        totalLines: usersToRetry.length,
        validCount: usersToRetry.length,
        errorCount: 0
      }
    });
    
    setShowResultModal(false);
    setImportResult(null);
  };

  const resetComponent = () => {
    setShowResultModal(false);
    setImportResult(null);
    cancelImport();
  };

  const allPreviewRows = parsedResults 
    ? [...parsedResults.validUsers, ...parsedResults.invalidUsers].sort((a, b) => a.rowNumber - b.rowNumber)
    : [];

  const handleStartEdit = (row, idx) => {
    setEditingRow(idx);
    setEditFormData({
      email: row.email || '',
      name: row.name || '',
      tier: row.tier || '',
      password: row.password || '',
      phone: row.phone || ''
    });
  };

  const handleSaveEdit = (idx) => {
    const newData = [...rawUserData];
    newData[idx] = { ...editFormData };
    
    setRawUserData(newData);
    const newValidation = parseAndValidateUsers(newData, 'csv', isRTL);
    setParsedResults(newValidation);
    setEditingRow(null);
  };

  return (
    <Card className="bg-card border-border w-full relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl text-foreground">
          {isRTL ? 'استيراد المستخدمين بكميات كبيرة' : 'Bulk Import Users'}
        </CardTitle>
        <Button variant="outline" onClick={downloadTemplate} className="text-foreground">
          <Download className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {isRTL ? 'تحميل القالب' : 'Download Template'}
        </Button>
      </CardHeader>
      <CardContent>
        
        {!parsedResults && !isImporting && (
          <div className="space-y-8">
            <div 
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-muted/30'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className={`w-16 h-16 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <h3 className="text-xl text-foreground mb-2">
                {isRTL ? 'اسحب الملف هنا أو انقر للاختيار' : 'Drag file here or click to select'}
              </h3>
              <p className="text-muted-foreground">
                {isRTL ? 'يدعم ملفات CSV بحد أقصى 5 ميغابايت' : 'Supports CSV files up to 5MB'}
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv,.xlsx" 
                onChange={handleFileChange}
              />
              <Button className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
                {isRTL ? 'اختر ملف' : 'Choose File'}
              </Button>
            </div>

            <div className="pt-8 border-t border-border">
              <label className="block text-sm font-medium text-foreground mb-2">
                {isRTL ? 'أو الصق البيانات يدوياً' : 'Or Paste Data Manually'}
              </label>
              <p className="text-xs text-muted-foreground mb-4">
                {isRTL ? 'الصيغة: البريد، الاسم، الفئة، كلمة المرور، الهاتف (كل سطر = مستخدم واحد)' : 'Format: email, name, tier, password, phone (Each line = one user)'}
              </p>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={`user1@example.com, Ali Mustang, Collector, SecurePass123, +964-123-456-7890\nuser2@example.com, Ahmed_Spider, Hobbyist, AnotherPass456, `}
                className="w-full min-h-[200px] bg-background border border-border rounded-md p-4 text-foreground font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y transition-all placeholder:text-muted-foreground"
              />
              <Button
                onClick={handleTextProcess}
                disabled={!textInput.trim()}
                className="mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all duration-300"
              >
                {isRTL ? 'معالجة النص' : 'Process Text'}
              </Button>
            </div>
          </div>
        )}

        {parsedResults && !isImporting && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg border border-border">
              <div className="flex items-center gap-4">
                <FileCheck className="w-8 h-8 text-primary" />
                <div>
                  <h4 className="text-foreground font-medium">{isRTL ? 'معاينة البيانات' : 'Data Preview'}</h4>
                  <p className="text-sm text-muted-foreground">
                    {parsedResults.summary.validCount} {isRTL ? 'صفوف جاهزة للاستيراد' : 'lines ready to import'} • {parsedResults.summary.errorCount} {isRTL ? 'بها أخطاء' : 'lines have errors'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="text-foreground"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> : <Eye className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />}
                  {isRTL ? (showPasswords ? 'إخفاء كلمات المرور' : 'إظهار كلمات المرور') : (showPasswords ? 'Hide Passwords' : 'Show Passwords')}
                </Button>
                <Button variant="ghost" size="icon" onClick={cancelImport} className="text-muted-foreground hover:text-destructive">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="rounded-md border border-border overflow-hidden max-h-[400px] overflow-y-auto relative">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow className="border-border">
                    <TableHead className="w-16">{isRTL ? 'صف' : 'Line'}</TableHead>
                    <TableHead>{isRTL ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                    <TableHead>{isRTL ? 'الاسم' : 'Name'}</TableHead>
                    <TableHead>{isRTL ? 'الفئة' : 'Tier'}</TableHead>
                    <TableHead>{isRTL ? 'كلمة المرور' : 'Password'}</TableHead>
                    <TableHead>{isRTL ? 'رقم الهاتف' : 'Phone Number'}</TableHead>
                    <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPreviewRows.map((row, idx) => {
                    const isEditing = editingRow === idx;
                    return (
                    <TableRow key={idx} className="border-border hover:bg-muted/30">
                      <TableCell className="text-muted-foreground">{row.rowNumber}</TableCell>
                      <TableCell className="text-foreground">
                        {isEditing ? (
                          <Input 
                            value={editFormData.email} 
                            onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                            className="h-8 min-w-[150px]"
                          />
                        ) : row.email}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {isEditing ? (
                          <Input 
                            value={editFormData.name} 
                            onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                            className="h-8 min-w-[120px]"
                          />
                        ) : row.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground capitalize">
                        {isEditing ? (
                          <Input 
                            value={editFormData.tier} 
                            onChange={(e) => setEditFormData({...editFormData, tier: e.target.value})}
                            className="h-8 min-w-[100px]"
                          />
                        ) : row.tier}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {isEditing ? (
                          <Input 
                            value={editFormData.password} 
                            onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                            className="h-8 min-w-[100px]"
                            type={showPasswords ? 'text' : 'password'}
                          />
                        ) : (showPasswords ? row.password : '••••••••')}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {isEditing ? (
                          <Input 
                            value={editFormData.phone} 
                            onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                            className="h-8 min-w-[120px]"
                          />
                        ) : (row.phone || '-')}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-2 min-w-[120px]">
                            <Button size="sm" onClick={() => handleSaveEdit(idx)} className="h-8">{isRTL ? 'حفظ' : 'Save'}</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingRow(null)} className="h-8">{isRTL ? 'إلغاء' : 'Cancel'}</Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-[120px]">
                            {!row.errors || row.errors.length === 0 ? (
                              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                                {isRTL ? '✓ صالح' : '✓ Valid'}
                              </Badge>
                            ) : (
                              <>
                                <div className="group relative inline-block">
                                  <Badge variant="destructive" className="cursor-help">
                                    {isRTL ? '✗ خطأ' : '✗ Error'}
                                  </Badge>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-popover text-popover-foreground text-xs rounded shadow-lg border border-border z-20">
                                    <ul className="list-disc pl-4 space-y-1">
                                      {row.errors.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                  </div>
                                </div>
                                <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => handleStartEdit(row, idx)}>
                                  {isRTL ? 'تعديل' : 'Edit'}
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-border">
              <Button variant="outline" onClick={cancelImport}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button 
                onClick={executeImport} 
                disabled={parsedResults.summary.errorCount > 0 || parsedResults.summary.validCount === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isRTL ? 'استيراد المستخدمين' : 'Import Users'}
              </Button>
            </div>
            
            {parsedResults.summary.errorCount > 0 && (
              <p className="text-destructive text-sm text-right mt-2 flex items-center justify-end gap-1">
                <AlertCircle className="w-4 h-4" />
                {isRTL ? 'يرجى إصلاح الأخطاء قبل الاستيراد' : 'Please fix errors before importing'}
              </p>
            )}
          </div>
        )}

        {isImporting && (
          <div className="py-16 text-center flex flex-col items-center space-y-6">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="w-full max-w-md space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-muted-foreground">
                {isRTL ? `جاري استيراد المستخدمين... ${progress}%` : `Importing users... ${progress}%`}
              </p>
            </div>
          </div>
        )}
        
      </CardContent>

      <Dialog open={showResultModal} onOpenChange={(open) => !open && resetComponent()}>
        <DialogContent className="bg-card text-foreground sm:max-w-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-primary" />
              {isRTL ? 'نتيجة الاستيراد' : 'Import Results'}
            </DialogTitle>
            <DialogDescription>
              {isRTL ? 'ملخص عملية استيراد المستخدمين' : 'Summary of the user import process'}
            </DialogDescription>
          </DialogHeader>
          
          {importResult && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">{importResult.imported}</div>
                  <div className="text-sm text-green-600/80">{isRTL ? 'تم الاستيراد بنجاح' : 'Successfully Imported'}</div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center opacity-50">
                  <div className="text-3xl font-bold text-yellow-600 mb-1">{importResult.skipped}</div>
                  <div className="text-sm text-yellow-600/80">{isRTL ? 'تم التخطي' : 'Skipped'}</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-red-600 mb-1">{importResult.failed}</div>
                  <div className="text-sm text-red-600/80">{isRTL ? 'فشل الاستيراد' : 'Failed to Import'}</div>
                </div>
              </div>

              {(importResult.failedUsers?.length > 0 || importResult.skippedUsers?.length > 0) && (
                <div className="border border-border rounded-md overflow-hidden max-h-48 overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-muted sticky top-0">
                      <TableRow className="border-border">
                        <TableHead className="w-16">{isRTL ? 'صف' : 'Row'}</TableHead>
                        <TableHead>{isRTL ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                        <TableHead>{isRTL ? 'السبب' : 'Reason'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.failedUsers?.map((err, i) => (
                        <TableRow key={`err-${i}`} className="border-border bg-red-500/5">
                          <TableCell className="text-muted-foreground">{err.rowNumber || '-'}</TableCell>
                          <TableCell className="text-foreground">{err.email || '-'}</TableCell>
                          <TableCell className="text-red-500">{err.error || 'Unknown error'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-between items-center sm:justify-between w-full">
            <div className="flex gap-2">
              {(importResult?.failedUsers?.length > 0 || importResult?.skippedUsers?.length > 0) && (
                <Button variant="outline" onClick={downloadErrorReport}>
                  <Download className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {isRTL ? 'تحميل تقرير الأخطاء' : 'Download Error Report'}
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {importResult?.failedUsers?.length > 0 && (
                <Button variant="outline" onClick={handleRetry}>
                  <RefreshCw className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {isRTL ? 'إعادة المحاولة' : 'Retry Failed'}
                </Button>
              )}
              <Button variant="outline" onClick={resetComponent}>
                {isRTL ? 'إغلاق' : 'Close'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BulkUserImport;
