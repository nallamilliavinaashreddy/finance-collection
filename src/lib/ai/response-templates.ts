import { SupportedLanguageCode } from './multilingual-lexicon';
import { formatCurrency } from '@/lib/utils';

export interface CustomerDataPayload {
  customer_id: string;
  customer_name: string;
  mobile_number?: string;
  activeLoansCount: number;
  totalPrincipalOutstanding: number;
  totalAccruedAdjustmentInterest: number;
  totalPayableAmount: number;
  recentCollectionsCount: number;
  lastCollectionAmount: number;
  lastCollectionDate?: string;
}

export interface DayBookPayload {
  openingBalance: number;
  closingBalance: number;
  totalIncome: number;
  totalExpenses: number;
}

export interface FinancialStatementsPayload {
  totalAssets: number;
  totalLiabilities: number;
  netProfitLoss: number;
}

/**
 * Multilingual Financial Response Formatter
 */
export class MultilingualResponseFormatter {

  /**
   * Format Customer Count Response
   */
  static formatCustomerCount(count: number, lang: SupportedLanguageCode): string {
    switch (lang) {
      case 'te': return `**మొత్తం వినియోగదారులు (Total Customers)**: **${count}**`;
      case 'hi': return `**कुल ग्राहक (Total Customers)**: **${count}**`;
      case 'ta': return `**மொத்த வாடிக்கையாளர்கள் (Total Customers)**: **${count}**`;
      case 'kn': return `**ಒಟ್ಟು ಗ್ರಾಹಕರು (Total Customers)**: **${count}**`;
      case 'ml': return `**ആകെ ഉപഭോക്താക്കൾ (Total Customers)**: **${count}**`;
      case 'mr': return `**एकूण ग्राहक (Total Customers)**: **${count}**`;
      case 'bn': return `**মোট গ্রাহক (Total Customers)**: **${count}**`;
      case 'gu': return `**કુલ ગ્રાહકો (Total Customers)**: **${count}**`;
      case 'pa': return `**ਕੁੱਲ ਗ੍ਰਾਹਕ (Total Customers)**: **${count}**`;
      case 'or': return `**ମୋଟ ଗ୍ରାହକ (Total Customers)**: **${count}**`;
      case 'as': return `**মুঠ গ্ৰাহক (Total Customers)**: **${count}**`;
      case 'ur': return `**کل گاہک (Total Customers)**: **${count}**`;
      case 'ne': return `**जम्मा ग्राहकहरू (Total Customers)**: **${count}**`;
      case 'gom': return `**एकूण ग्राहक (Total Customers)**: **${count}**`;
      case 'mni': return `**অপুনবা মৈতৈলোন্ গ্রাহক (Total Customers)**: **${count}**`;
      case 'brx': return `**गासै ग्राहक (Total Customers)**: **${count}**`;
      case 'doi': return `**कुल ग्राहक (Total Customers)**: **${count}**`;
      case 'mai': return `**कुल ग्राहक (Total Customers)**: **${count}**`;
      case 'sa': return `**एकूण ग्राहकाः (Total Customers)**: **${count}**`;
      case 'ks': return `**کُل گَراہَکھ (Total Customers)**: **${count}**`;
      case 'sd': return `**ڪل گراهڪ (Total Customers)**: **${count}**`;
      case 'sat': return `**ᱡᱚᱛᱚ ᱜᱽᱨᱟᱦᱟᱠ (Total Customers)**: **${count}**`;
      default: return `**Total Customers**: **${count}**`;
    }
  }

  /**
   * Format Today's Collection Response
   */
  static formatTodayCollection(amount: number, count: number, lang: SupportedLanguageCode): string {
    const formattedAmount = formatCurrency(amount);
    switch (lang) {
      case 'te': return `**ఈ రోజు మొత్తం వసూలు (Today's Collection)**: **${formattedAmount}** (${count} లావాదేవీలు)`;
      case 'hi': return `**आज की कुल कलेक्शन (Today's Collection)**: **${formattedAmount}** (${count} लेन-देन)`;
      case 'ta': return `**இன்றைய மொத்த வசூல் (Today's Collection)**: **${formattedAmount}** (${count} பரிவர்த்தனைகள்)`;
      case 'kn': return `**ಇಂದಿನ ಒಟ್ಟು ಸಂಗ್ರಹಣೆ (Today's Collection)**: **${formattedAmount}** (${count} વ્યવહારો)`;
      case 'ml': return `**ഇന്നത്തെ ആകെ ശേഖരണം (Today's Collection)**: **${formattedAmount}** (${count} ഇടപാടുകൾ)`;
      case 'mr': return `**आजचे एकूण कलेक्शन (Today's Collection)**: **${formattedAmount}** (${count} व्यवहार)`;
      case 'bn': return `**আজকের মোট কালেকশন (Today's Collection)**: **${formattedAmount}** (${count} টি লেনদেন)`;
      case 'gu': return `**આજનું કુલ કલેક્શન (Today's Collection)**: **${formattedAmount}** (${count} વ્યવહારો)`;
      case 'pa': return `**ਅੱਜ ਦੀ ਕੁੱਲ ਉਗਰਾਹੀ (Today's Collection)**: **${formattedAmount}** (${count} ਲੈਣ-ਦੇਣ)`;
      case 'or': return `**ଆଜିର ମୋଟ ସଂଗ୍ରହ (Today's Collection)**: **${formattedAmount}** (${count} ଟି କାରବାର)`;
      case 'as': return `**আজিৰ মুঠ সংগ্ৰহ (Today's Collection)**: **${formattedAmount}** (${count} টা লেনদেন)`;
      case 'ur': return `**آج کی کل وصولی (Today's Collection)**: **${formattedAmount}** (${count} لین دین)`;
      case 'ne': return `**आजको जम्मा कलेक्सन (Today's Collection)**: **${formattedAmount}** (${count} कारोबारहरू)`;
      case 'gom': return `**आजचें एकूण कलेक्शन (Today's Collection)**: **${formattedAmount}** (${count} व्यवहार)`;
      case 'mni': return `**ঙসিগী কালেকশন (Today's Collection)**: **${formattedAmount}** (${count} ट्रांजेक्सन)`;
      case 'brx': return `**दिनैनि गासै कलेक्सन (Today's Collection)**: **${formattedAmount}** (${count} लेन-देन)`;
      case 'doi': return `**अज्जै दी कुल कलेक्शन (Today's Collection)**: **${formattedAmount}** (${count} लेन-देन)`;
      case 'mai': return `**आईक कुल कलेक्शन (Today's Collection)**: **${formattedAmount}** (${count} लेन-देन)`;
      case 'sa': return `**अद्यतन सङ्ग्रहః (Today's Collection)**: **${formattedAmount}** (${count} व्यवहाराः)`;
      case 'ks': return `**آزُک کُل کَلیَکشَن (Today's Collection)**: **${formattedAmount}** (${count} لیندین)`;
      case 'sd': return `**آج جي ڪل وصولي (Today's Collection)**: **${formattedAmount}** (${count} ڏيتي ليتي)`;
      case 'sat': return `**ᱛᱮᱦᱮᱧ ᱨᱮᱱᱟᱜ ᱠᱚᱞᱮᱠᱥᱚᱱ (Today's Collection)**: **${formattedAmount}** (${count} ᱴᱨᱟᱱᱡᱮᱠᱥᱚᱱ)`;
      default: return `**Today's Collection**: **${formattedAmount}** (${count} transactions)`;
    }
  }

  /**
   * Format Monthly Collection Response
   */
  static formatMonthlyCollection(amount: number, count: number, lang: SupportedLanguageCode): string {
    const formattedAmount = formatCurrency(amount);
    switch (lang) {
      case 'te': return `**ఈ నెల మొత్తం వసూలు (This Month's Collection)**: **${formattedAmount}** (${count} లావాదేవీలు)`;
      case 'hi': return `**इस महीने की कुल कलेक्शन (This Month's Collection)**: **${formattedAmount}** (${count} लेन-देन)`;
      case 'ta': return `**இந்த மாத மொத்த வசூல் (This Month's Collection)**: **${formattedAmount}** (${count} பரிவர்த்தனைகள்)`;
      case 'kn': return `**ಈ ತಿಂಗಳ ಒಟ್ಟು ಸಂಗ್ರಹಣೆ (This Month's Collection)**: **${formattedAmount}** (${count} ವ್ಯವಹಾರಗಳು)`;
      case 'ml': return `**ഈ മാസത്തെ ആകെ ശേഖരണം (This Month's Collection)**: **${formattedAmount}** (${count} ഇടപാടുകൾ)`;
      case 'mr': return `**या महिन्याचे एकूण कलेक्शन (This Month's Collection)**: **${formattedAmount}** (${count} व्यवहार)`;
      case 'bn': return `**এই মাসের মোট কালেকশন (This Month's Collection)**: **${formattedAmount}** (${count} টি লেনদেন)`;
      case 'gu': return `**આ મહિનાનું કુલ કલેક્શન (This Month's Collection)**: **${formattedAmount}** (${count} વ્યવહારો)`;
      case 'pa': return `**ਇਸ ਮਹੀਨੇ ਦੀ ਕੁੱਲ ਉਗਰਾਹੀ (This Month's Collection)**: **${formattedAmount}** (${count} ਲੈਣ-ਦੇਣ)`;
      case 'or': return `**ଏହି ମାସର ମୋଟ ସଂଗ୍ରହ (This Month's Collection)**: **${formattedAmount}** (${count} ଟି କାରବାର)`;
      case 'as': return `**এই মাহৰ মুঠ সংগ্ৰহ (This Month's Collection)**: **${formattedAmount}** (${count} টা লেনদেন)`;
      case 'ur': return `**اس ماہ کی کل وصولی (This Month's Collection)**: **${formattedAmount}** (${count} لین دین)`;
      case 'ne': return `**यस महिनाको जम्मा कलेक्सन (This Month's Collection)**: **${formattedAmount}** (${count} कारोबारहरू)`;
      default: return `**This Month's Collection**: **${formattedAmount}** (${count} transactions)`;
    }
  }

  /**
   * Format Customer Balance Lookup Response
   */
  static formatCustomerDetails(data: CustomerDataPayload, lang: SupportedLanguageCode): string {
    const principalStr = formatCurrency(data.totalPrincipalOutstanding);
    const interestStr = formatCurrency(data.totalAccruedAdjustmentInterest);
    const totalStr = formatCurrency(data.totalPayableAmount);

    switch (lang) {
      case 'te':
        return `👤 **ఖాతాదారుడు (Customer)**: **${data.customer_name}** (${data.customer_id})\n\n` +
          `• **యాక్టివ్ అప్పులు (Active Loans)**: ${data.activeLoansCount}\n` +
          `• **అసలు బాకీ (Principal Outstanding)**: **${principalStr}**\n` +
          `• **అక్రూడ్ వడ్డీ (Accrued Adj Interest)**: **${interestStr}**\n` +
          `• **మొత్తం చెల్లించాల్సిన బాకీ (Total Payable)**: **${totalStr}**\n` +
          `• **ఇటీవలి వసూళ్లు (Recent Collections)**: ${data.recentCollectionsCount} (చివరిగా: ${formatCurrency(data.lastCollectionAmount)})`;

      case 'hi':
        return `👤 **ग्राहक विवरण (Customer)**: **${data.customer_name}** (${data.customer_id})\n\n` +
          `• **एक्टिव लोन (Active Loans)**: ${data.activeLoansCount}\n` +
          `• **मूलधन बकाया (Principal Outstanding)**: **${principalStr}**\n` +
          `• **संचित ब्याज (Accrued Adj Interest)**: **${interestStr}**\n` +
          `• **कुल देय राशि (Total Payable)**: **${totalStr}**\n` +
          `• **हाल की वसूली (Recent Collections)**: ${data.recentCollectionsCount} (अंतिम: ${formatCurrency(data.lastCollectionAmount)})`;

      case 'ta':
        return `👤 **வாடிக்கையாளர் (Customer)**: **${data.customer_name}** (${data.customer_id})\n\n` +
          `• **செயலில் உள்ள கடன்கள் (Active Loans)**: ${data.activeLoansCount}\n` +
          `• **அசல் பாக்கி (Principal Outstanding)**: **${principalStr}**\n` +
          `• **திரண்ட வட்டி (Accrued Adj Interest)**: **${interestStr}**\n` +
          `• **மொத்த பாக்கி (Total Payable)**: **${totalStr}**\n` +
          `• **சமீபத்திய வசூல் (Recent Collections)**: ${data.recentCollectionsCount}`;

      case 'kn':
        return `👤 **ಗ್ರಾಹಕರ ವಿವರ (Customer)**: **${data.customer_name}** (${data.customer_id})\n\n` +
          `• **ಸಕ್ರಿಯ ಸಾಲಗಳು (Active Loans)**: ${data.activeLoansCount}\n` +
          `• **ಅಸಲು ಬಾಕಿ (Principal Outstanding)**: **${principalStr}**\n` +
          `• **ಸಂಚಿತ ಬಡ್ಡಿ (Accrued Adj Interest)**: **${interestStr}**\n` +
          `• **ಒಟ್ಟು ಪಾವತಿಸಬೇಕಾದ ಬಾಕಿ (Total Payable)**: **${totalStr}**`;

      default:
        return `👤 **Customer Profile**: **${data.customer_name}** (${data.customer_id})\n\n` +
          `• **Active Loans**: ${data.activeLoansCount}\n` +
          `• **Principal Outstanding**: **${principalStr}**\n` +
          `• **Accrued Adjustment Interest**: **${interestStr}**\n` +
          `• **Total Outstanding Balance**: **${totalStr}**\n` +
          `• **Recent Collections**: ${data.recentCollectionsCount} recorded (Last: ${formatCurrency(data.lastCollectionAmount)})`;
    }
  }

  /**
   * Format Cash in Hand / Day Book Balances
   */
  static formatCashInHand(cashAmount: number, closingBalance: number, lang: SupportedLanguageCode): string {
    const formattedCash = formatCurrency(cashAmount);
    const formattedClosing = formatCurrency(closingBalance);

    switch (lang) {
      case 'te':
        return `💰 **చేతిలో నగదు (Cash in Hand)**: **${formattedCash}**\n📖 **డే బుక్ ముగింపు నిల్వ (Closing Balance)**: **${formattedClosing}**`;
      case 'hi':
        return `💰 **हाथ में नकद (Cash in Hand)**: **${formattedCash}**\n📖 **डे बुक क्लोजिंग बैलेंस (Closing Balance)**: **${formattedClosing}**`;
      case 'ta':
        return `💰 **கையிருப்பு ரொக்கம் (Cash in Hand)**: **${formattedCash}**\n📖 **முடிவு இருப்பு (Closing Balance)**: **${formattedClosing}**`;
      case 'kn':
        return `💰 **ಕೈಯಲ್ಲಿರುವ ನಗದು (Cash in Hand)**: **${formattedCash}**\n📖 **ಅಂತಿಮ ಬಾಕಿ (Closing Balance)**: **${formattedClosing}**`;
      case 'ml':
        return `💰 **കയ്യിലുള്ള പണം (Cash in Hand)**: **${formattedCash}**\n📖 **അവസാന ബാലൻസ് (Closing Balance)**: **${formattedClosing}**`;
      case 'mr':
        return `💰 **हातात रोख (Cash in Hand)**: **${formattedCash}**\n📖 **अंतिम शिल्लक (Closing Balance)**: **${formattedClosing}**`;
      case 'bn':
        return `💰 **হাতে নগদ (Cash in Hand)**: **${formattedCash}**\n📖 **সমাপনী জের (Closing Balance)**: **${formattedClosing}**`;
      case 'gu':
        return `💰 **હાથ પર રોકડ (Cash in Hand)**: **${formattedCash}**\n📖 **આખર સ્ટોક/બેલેન્સ (Closing Balance)**: **${formattedClosing}**`;
      default:
        return `💰 **Cash in Hand**: **${formattedCash}**\n📖 **Day Book Closing Balance**: **${formattedClosing}**`;
    }
  }

  /**
   * Format Active Loans Summary
   */
  static formatActiveLoans(activeCount: number, totalPrincipal: number, lang: SupportedLanguageCode): string {
    const formattedPrincipal = formatCurrency(totalPrincipal);
    switch (lang) {
      case 'te': return `🏦 **యాక్టివ్ అప్పుల సంఖ్య (Active Loans)**: **${activeCount}**\n💰 **మొత్తం అసలు బాకీ (Total Principal Balance)**: **${formattedPrincipal}**`;
      case 'hi': return `🏦 **एक्टिव लोन संख्या (Active Loans)**: **${activeCount}**\n💰 **कुल मूलधन बकाया (Total Principal Balance)**: **${formattedPrincipal}**`;
      case 'ta': return `🏦 **செயலில் உள்ள கடன்கள் (Active Loans)**: **${activeCount}**\n💰 **மொத்த அசல் பாக்கி (Total Principal Balance)**: **${formattedPrincipal}**`;
      case 'kn': return `🏦 **ಸಕ್ರಿಯ ಸಾಲಗಳು (Active Loans)**: **${activeCount}**\n💰 **ಒಟ್ಟು ಅಸಲು ಬಾಕಿ (Total Principal Balance)**: **${formattedPrincipal}**`;
      default: return `🏦 **Active Loans**: **${activeCount}**\n💰 **Total Principal Outstanding**: **${formattedPrincipal}**`;
    }
  }

  /**
   * Format Financial Statements (Assets, Liabilities, Profit/Loss)
   */
  static formatFinancialStatements(data: FinancialStatementsPayload, lang: SupportedLanguageCode): string {
    const assetsStr = formatCurrency(data.totalAssets);
    const liabilitiesStr = formatCurrency(data.totalLiabilities);
    const profitStr = formatCurrency(data.netProfitLoss);
    const isProfit = data.netProfitLoss >= 0;

    switch (lang) {
      case 'te':
        return `⚖️ **ఫైనాన్షియల్ స్టేట్‌మెంట్స్ (Financial Statements)**:\n\n` +
          `• **మొత్తం ఆస్తులు (Total Assets)**: **${assetsStr}**\n` +
          `• **మొత్తం అప్పులు/లయబిలిటీస్ (Total Liabilities)**: **${liabilitiesStr}**\n` +
          `• **${isProfit ? 'నికర లాభం (Net Profit)' : 'నికర నష్టం (Net Loss)'}**: **${profitStr}**`;

      case 'hi':
        return `⚖️ **वित्तीय विवरण (Financial Statements)**:\n\n` +
          `• **कुल संपत्ति (Total Assets)**: **${assetsStr}**\n` +
          `• **कुल देनदारियां (Total Liabilities)**: **${liabilitiesStr}**\n` +
          `• **${isProfit ? 'शुद्ध लाभ (Net Profit)' : 'शुद्ध हानि (Net Loss)'}**: **${profitStr}**`;

      case 'ta':
        return `⚖️ **நிதி நிலை அறிக்கை (Financial Statements)**:\n\n` +
          `• **மொத்த சொத்துக்கள் (Total Assets)**: **${assetsStr}**\n` +
          `• **மொத்த பொறுப்புகள் (Total Liabilities)**: **${liabilitiesStr}**\n` +
          `• **${isProfit ? 'நிகர லாபம் (Net Profit)' : 'நிகர நஷ்டம் (Net Loss)'}**: **${profitStr}**`;

      default:
        return `⚖️ **Financial Statements Summary**:\n\n` +
          `• **Total Assets**: **${assetsStr}**\n` +
          `• **Total Liabilities**: **${liabilitiesStr}**\n` +
          `• **${isProfit ? 'Net Profit' : 'Net Loss'}**: **${profitStr}**`;
    }
  }
}
