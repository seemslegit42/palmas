import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'formatOutput',
})
export class FormatOutput implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';

    // Escape basic HTML entities first to prevent injection
    let text = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks with syntax container
    text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
      const languageBadge = lang ? `<div class="text-[10px] uppercase font-mono tracking-wider text-[#20B2AA] px-3 py-1 bg-[#14161C] border-b border-white/5 flex items-center justify-between"><span>${lang}</span></div>` : '';
      return `<div class="my-3 rounded-xl bg-[#08090C] border border-white/10 overflow-hidden font-mono text-xs text-[#F5FFFA]">${languageBadge}<pre class="p-3.5 overflow-x-auto whitespace-pre font-mono"><code>${code.trim()}</code></pre></div>`;
    });

    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-[#1A1C23] border border-white/10 font-mono text-xs text-[#20B2AA]">$1</code>');

    // Headers
    text = text.replace(/^### (.*$)/gim, '<h3 class="font-display font-semibold text-base text-[#F5FFFA] mt-4 mb-2">$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2 class="font-display font-bold text-lg text-[#F5FFFA] mt-5 mb-2.5">$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1 class="font-display font-bold text-xl text-[#F5FFFA] mt-6 mb-3 text-[#20B2AA]">$1</h1>');

    // Bold & Italics
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em class="italic text-[#8C94A8]">$1</em>');

    // Unordered list items
    text = text.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ml-4 list-disc text-sm text-[#F5FFFA] leading-relaxed">$1</li>');

    // Ordered list items
    text = text.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<li class="ml-4 list-decimal text-sm text-[#F5FFFA] leading-relaxed">$2</li>');

    // Line breaks (convert single newlines that are not inside tags to <br>)
    text = text.replace(/\n\n/g, '<p class="my-2.5"></p>');
    text = text.replace(/\n/g, '<br />');

    return this.sanitizer.bypassSecurityTrustHtml(text);
  }
}
