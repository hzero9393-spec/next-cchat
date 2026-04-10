"use client";

import React, { useState } from "react";
import { Mail, ExternalLink, Copy, Check, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface EmailData {
  to: string;
  subject: string;
  body: string;
}

interface EmailCardProps {
  email: EmailData;
}

export function EmailCard({ email }: EmailCardProps) {
  const [copied, setCopied] = useState(false);

  const openInGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email.to)}&su=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  const openInOutlook = () => {
    const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(email.to)}&subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
    window.open(outlookUrl, "_blank", "noopener,noreferrer");
  };

  const copyEmail = async () => {
    const text = `To: ${email.to}\nSubject: ${email.subject}\n\n${email.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mailtoLink = `mailto:${email.to}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto sm:mx-0"
    >
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Email Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Email Ready to Send</span>
          </div>
        </div>

        {/* Email Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">To</p>
              <p className="text-sm font-medium truncate">{email.to}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Subject</p>
              <p className="text-sm font-medium">{email.subject}</p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 max-h-40 overflow-y-auto">
            <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {email.body}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={openInGmail}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Gmail & Send
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={openInOutlook}
                className="flex-1 h-8 text-xs gap-1.5"
              >
                <ExternalLink className="w-3 h-3" />
                Outlook
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = mailtoLink}
                className="flex-1 h-8 text-xs gap-1.5"
              >
                <Mail className="w-3 h-3" />
                Mail App
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={copyEmail}
                className="h-8 w-8 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
