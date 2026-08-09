'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { UserType } from '@/lib/types'

type Props = {
  open: boolean
  onClose: () => void
  onSuccess: (type: UserType) => void
}

export function AuthDialog({ open, onClose, onSuccess }: Props) {
  const [otpStep, setOtpStep] = useState(false)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [userType, setUserType] = useState<UserType>('customer')

  const normalizedPhone = phone.replace(/\D/g, '')
  const validPhone = /^(010|011|012|015)\d{8}$/.test(normalizedPhone)

  const handleClose = () => {
    onClose()
    setTimeout(() => { setOtpStep(false); setPhone(''); setOtp('') }, 300)
  }

  const handleConfirm = () => {
    onSuccess(userType)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right text-2xl font-black">
            {otpStep ? 'تأكيد رقم الموبايل' : 'أهلاً بيك في سوق الجملة'}
          </DialogTitle>
          <DialogDescription className="text-right">
            {otpStep
              ? 'اكتب الكود المكون من 4 أرقام المرسل إليك'
              : 'سجل دخولك لتشوف أفضل الأسعار والعروض'}
          </DialogDescription>
        </DialogHeader>

        {otpStep ? (
          <div className="flex flex-col gap-4">
            <Input
              inputMode="numeric"
              maxLength={4}
              placeholder="0000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="h-14 text-center text-2xl tracking-[0.5em]"
            />
            <Button className="h-12 rounded-2xl" onClick={handleConfirm} disabled={otp.length !== 4}>
              تأكيد ودخول
            </Button>
            <Button variant="ghost" onClick={() => setOtpStep(false)}>رجوع</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Button
                variant={userType === 'customer' ? 'default' : 'outline'}
                className="flex-1 rounded-xl"
                onClick={() => setUserType('customer')}
              >
                عميل
              </Button>
              <Button
                variant={userType === 'wholesale' ? 'default' : 'outline'}
                className="flex-1 rounded-xl"
                onClick={() => setUserType('wholesale')}
              >
                تاجر جملة
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">رقم الموبايل</Label>
              <div className="relative">
                <Input
                  id="phone"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  inputMode="tel"
                  className="h-12 rounded-xl pr-10 text-right"
                />
                {validPhone && (
                  <Check className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-primary" />
                )}
              </div>
              {phone.length > 0 && !validPhone && (
                <p className="text-xs text-destructive">
                  اكتب رقمًا مصريًا صحيحًا من 11 رقمًا يبدأ بـ 010 أو 011 أو 012 أو 015
                </p>
              )}
            </div>

            <Button
              className="h-12 rounded-2xl"
              disabled={!validPhone}
              onClick={() => setOtpStep(true)}
            >
              إرسال كود التحقق
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
