import os

file_path = os.path.join('cms-techsonance', 'src', 'app', 'dashboard', 'finance', 'invoices', 'new', 'page.tsx')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update useEffect for initial fetch and branding listener
old_mount_effect = """  // 1. Fetch Clients, Company Branding, and Next Invoice Number
  useEffect(() => {
    fetchClients();
    loadLocalHistory();
    fetchCompanySettings();
  }, []);"""

new_mount_effect = """  // 1. Fetch Clients, Company Branding, and Next Invoice Number
  useEffect(() => {
    fetchClients();
    loadLocalHistory();
    fetchCompanySettings();

    const handleBrandingUpdate = (e: any) => {
      const detail = e.detail;
      if (!detail) {
        fetchCompanySettings();
        return;
      }
      if (detail.stampUrl) setCompanyStampUrl(detail.stampUrl);
      if (detail.digitalSignatureUrl) setCompanySignatureUrl(detail.digitalSignatureUrl);
      if (detail.logoUrl) setCompanyLogo(detail.logoUrl);
      if (detail.signatoryName) setSignatoryName(detail.signatoryName);
      if (detail.signatoryTitle) setSignatoryTitle(detail.signatoryTitle);
      if (detail.tagline) setCompanyTagline(detail.tagline);
      if (detail.digitalSignatureEnabled !== undefined) setDigitalSignatureEnabled(Boolean(detail.digitalSignatureEnabled));
      if (detail.bankDetails) setBankDetails((prev) => ({ ...prev, ...detail.bankDetails }));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('branding-updated', handleBrandingUpdate);
      window.addEventListener('logo-updated', handleBrandingUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('branding-updated', handleBrandingUpdate);
        window.removeEventListener('logo-updated', handleBrandingUpdate);
      }
    };
  }, []);"""

# 2. Update loadExistingInvoice headers typing
old_load_inv = """  const loadExistingInvoice = async (id: number) => {
    if (!id || isNaN(id)) return;
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/invoices?id=${id}`, { headers, credentials: 'include' });
      if (res.ok) {
        const inv = await res.json();
        setInvoiceNo(inv.invoiceNumber || `TS-INV-${id}`);
        if (inv.dueDate) setDueDate(inv.dueDate);
        if (inv.createdAt) setInvoiceDate(inv.createdAt.slice(0, 10));
        if (inv.notes) setNotes(inv.notes);
        if (inv.termsAndConditions) setTerms(inv.termsAndConditions);
        if (inv.paymentTerms) setPaymentTerms(inv.paymentTerms);
        if (inv.status === 'paid') setPaymentStatus('Paid');
        if (inv.amount) setAmountReceived(String(inv.amount));

        // Line items
        const itemsRes = await fetch(`/api/invoice-items?invoiceId=${id}`, { headers, credentials: 'include' });"""

new_load_inv = """  const loadExistingInvoice = async (id: number) => {
    if (!id || isNaN(id)) return;
    try {
      const token = getStoredSessionToken();
      const reqHeaders: Record<string, string> = {};
      if (token && token !== 'null') reqHeaders['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/invoices?id=${id}`, { headers: reqHeaders as HeadersInit, credentials: 'include' });
      if (res.ok) {
        const inv = await res.json();
        setInvoiceNo(inv.invoiceNumber || `TS-INV-${id}`);
        if (inv.dueDate) setDueDate(inv.dueDate);
        if (inv.createdAt) setInvoiceDate(inv.createdAt.slice(0, 10));
        if (inv.notes) setNotes(inv.notes);
        if (inv.termsAndConditions) setTerms(inv.termsAndConditions);
        if (inv.paymentTerms) setPaymentTerms(inv.paymentTerms);
        if (inv.status === 'paid') setPaymentStatus('Paid');
        if (inv.amount) setAmountReceived(String(inv.amount));

        // Line items
        const itemsRes = await fetch(`/api/invoice-items?invoiceId=${id}`, { headers: reqHeaders as HeadersInit, credentials: 'include' });"""

# 3. Update populateClientFields and fetchClients
old_populate_and_fetch = """  const populateClientFields = (found: any) => {
    if (!found) return;

    // Company Name
    const cName =
      found.companyName ||
      found.company_name ||
      found.name ||
      found.contactPerson ||
      found.contact_person ||
      (found.email ? found.email.split('@')[0] : '');
    setClientName(cName);

    // Email
    const cEmail = found.email || found.companyEmail || found.company_email || '';
    setClientEmail(cEmail);

    // Contact Person
    const cContact =
      found.contactPerson ||
      found.contact_person ||
      found.contactName ||
      found.contact_name ||
      found.name ||
      cName;
    setContactPerson(cContact);

    // Phone
    const cPhone = found.phone || found.companyPhone || found.company_phone || '';
    setContactNumber(cPhone);

    // Country
    const cCountry = found.country || 'India';
    setCountry(cCountry);

    // State
    const cState = found.state || 'Gujarat';
    setState(cState);

    // Address
    const rawAddr = found.address || '';
    const cCity = found.city || '';
    const cPostal = found.postalCode || found.postal_code || '';
    let formattedAddress = rawAddr;
    if (!formattedAddress && (cCity || cState || cCountry)) {
      formattedAddress = [cCity, cState, cPostal, cCountry].filter(Boolean).join(', ');
    }
    setClientAddress(formattedAddress || (cState && cCountry ? `${cState}, ${cCountry}` : ''));

    // Tax ID (GST / VAT / TRN)
    const cTax = found.taxId || found.tax_id || found.gstin || found.vat || found.trn || '';
    if (cTax) setTaxId(cTax);

    // Currency
    if (found.currency && CURRENCY_SYMBOLS[found.currency]) {
      setCurrency(found.currency);
    }

    // Payment Terms
    if (found.paymentTerms || found.payment_terms) {
      setPaymentTerms(found.paymentTerms || found.payment_terms);
    }
  };

  const fetchClients = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/clients?limit=100', {
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data || [];
        setClients(list);
        if (list.length > 0 && !selectedClientId && !clientName) {
          setSelectedClientId(String(list[0].id));
          populateClientFields(list[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch clients:', err);
    }
  };"""

new_populate_and_fetch = """  const populateClientFields = (found: any) => {
    if (!found) return;

    // Company Name
    const cName =
      (found.companyName && String(found.companyName).trim()) ||
      (found.company_name && String(found.company_name).trim()) ||
      (found.clientName && String(found.clientName).trim()) ||
      (found.client_name && String(found.client_name).trim()) ||
      (found.name && String(found.name).trim()) ||
      (found.contactPerson && String(found.contactPerson).trim()) ||
      (found.contact_person && String(found.contact_person).trim()) ||
      (found.email ? String(found.email).split('@')[0] : '');
    setClientName(cName);

    // Email
    const cEmail =
      (found.email && String(found.email).trim()) ||
      (found.companyEmail && String(found.companyEmail).trim()) ||
      (found.company_email && String(found.company_email).trim()) ||
      (found.billingEmail && String(found.billingEmail).trim()) ||
      '';
    setClientEmail(cEmail);

    // Contact Person
    const cContact =
      (found.contactPerson && String(found.contactPerson).trim()) ||
      (found.contact_person && String(found.contact_person).trim()) ||
      (found.contactName && String(found.contactName).trim()) ||
      (found.contact_name && String(found.contact_name).trim()) ||
      (found.name && String(found.name).trim()) ||
      cName;
    setContactPerson(cContact);

    // Phone
    const cPhone =
      (found.phone && String(found.phone).trim()) ||
      (found.companyPhone && String(found.companyPhone).trim()) ||
      (found.company_phone && String(found.company_phone).trim()) ||
      (found.contactNumber && String(found.contactNumber).trim()) ||
      (found.mobile && String(found.mobile).trim()) ||
      '';
    setContactNumber(cPhone);

    // Country
    const cCountry = (found.country && String(found.country).trim()) || 'India';
    setCountry(cCountry);

    // State
    const cState = (found.state && String(found.state).trim()) || 'Gujarat';
    setState(cState);

    // Address
    const rawAddr = (found.address && String(found.address).trim()) || '';
    const cCity = (found.city && String(found.city).trim()) || '';
    const cPostal =
      (found.postalCode && String(found.postalCode).trim()) ||
      (found.postal_code && String(found.postal_code).trim()) ||
      '';
    let formattedAddress = rawAddr;
    if (!formattedAddress && (cCity || cState || cCountry)) {
      formattedAddress = [cCity, cState, cPostal, cCountry].filter(Boolean).join(', ');
    }
    setClientAddress(formattedAddress || (cState && cCountry ? `${cState}, ${cCountry}` : ''));

    // Tax ID (GST / VAT / TRN)
    const cTax =
      (found.taxId && String(found.taxId).trim()) ||
      (found.tax_id && String(found.tax_id).trim()) ||
      (found.gstin && String(found.gstin).trim()) ||
      (found.vat && String(found.vat).trim()) ||
      (found.trn && String(found.trn).trim()) ||
      '';
    if (cTax) setTaxId(cTax);

    // Currency
    if (found.currency && CURRENCY_SYMBOLS[found.currency]) {
      setCurrency(found.currency);
    }

    // Payment Terms
    if (found.paymentTerms || found.payment_terms) {
      setPaymentTerms(found.paymentTerms || found.payment_terms);
    }
  };

  const fetchClients = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/clients?limit=100', {
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data || [];
        setClients(list);
        if (list.length > 0 && !selectedClientId && !clientName) {
          const first = list[0];
          const firstId =
            first.id !== undefined && first.id !== null && first.id !== ''
              ? String(first.id)
              : (first.client_id || first.email || '0');
          setSelectedClientId(firstId);
          populateClientFields(first);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch clients:', err);
    }
  };"""

# 4. Update fetchCompanySettings and handleInlineUpload
old_company_settings = """  const fetchCompanySettings = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      // 1. Fetch Company Settings
      const res = await fetch('/api/company-settings', { headers, credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (data) {
          const tenantName = data.companyName || data.legalName || data.tenant?.name;
          if (tenantName) setCompanyName(tenantName);
          if (data.logoUrl) setCompanyLogo(data.logoUrl);
          if (data.tagline) setCompanyTagline(data.tagline);
          if (data.address) setCompanyAddress(data.address);
          if (data.email) setCompanyEmail(data.email);
          if (data.website) setCompanyWebsite(data.website);
          if (data.gstin) setCompanyGstin(data.gstin);
          if (data.cinNumber || data.llpin) setCompanyLlpin(data.cinNumber || data.llpin);
          if (data.stampUrl) setCompanyStampUrl(data.stampUrl);
          if (data.digitalSignatureUrl) setCompanySignatureUrl(data.digitalSignatureUrl);
          if (data.signatoryName) setSignatoryName(data.signatoryName);
          if (data.signatoryTitle) setSignatoryTitle(data.signatoryTitle);
          if (data.digitalSignatureEnabled !== undefined && data.digitalSignatureEnabled !== null) {
            setDigitalSignatureEnabled(Boolean(data.digitalSignatureEnabled));
          }
          if (data.bankDetails && typeof data.bankDetails === 'object' && Object.keys(data.bankDetails).length > 0) {
            setBankDetails((prev) => ({ ...prev, ...data.bankDetails }));
          }
        }
      }

      // 2. Fetch Workspace Settings for extended custom fields
      const wsRes = await fetch('/api/workspace-settings', { headers, credentials: 'include' });
      if (wsRes.ok) {
        const wsJson = await wsRes.json();
        const wsData = wsJson.data || wsJson;
        if (wsData) {
          if (wsData.stampUrl) setCompanyStampUrl(wsData.stampUrl);
          if (wsData.digitalSignatureUrl) setCompanySignatureUrl(wsData.digitalSignatureUrl);
          if (wsData.signatoryName) setSignatoryName(wsData.signatoryName);
          if (wsData.signatoryTitle) setSignatoryTitle(wsData.signatoryTitle);
          if (wsData.tagline) setCompanyTagline(wsData.tagline);
          if (wsData.bankDetails && typeof wsData.bankDetails === 'object' && Object.keys(wsData.bankDetails).length > 0) {
            setBankDetails((prev) => ({ ...prev, ...wsData.bankDetails }));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch dynamic company branding:', err);
    }
  };

  const handleInlineUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'stamp' | 'signature' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (target === 'stamp') {
        setCompanyStampUrl(dataUrl);
        setStampEnabled(true);
      } else if (target === 'signature') {
        setCompanySignatureUrl(dataUrl);
        setDigitalSignatureEnabled(true);
      } else if (target === 'logo') {
        setCompanyLogo(dataUrl);
      }
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', 'avatar');
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/upload', { method: 'POST', headers, body: formData });
      if (res.ok) {
        const json = await res.json();
        const uploadedUrl = json.data?.url || json.url;
        if (uploadedUrl) {
          if (target === 'stamp') setCompanyStampUrl(uploadedUrl);
          if (target === 'signature') setCompanySignatureUrl(uploadedUrl);
          if (target === 'logo') setCompanyLogo(uploadedUrl);
        }
      }
      toast.success(`${target === 'stamp' ? 'Corporate Stamp' : target === 'signature' ? 'Signature' : 'Logo'} updated!`);
    } catch {
      toast.info('Using locally uploaded preview image.');
    }
  };

  // 2. Handle Client Selection from Dropdown
  const handleSelectClient = (cid: string) => {
    setSelectedClientId(cid);
    if (!cid) return;
    const found = clients.find((c) => String(c.id) === cid);
    if (found) {
      populateClientFields(found);
      const displayName = found.companyName || found.company_name || found.email || 'Client';
      toast.success(`Client details for "${displayName}" auto-filled!`);
    }
  };"""

new_company_settings = """  const fetchCompanySettings = async () => {
    // 1. Instant hydration from client storage cache
    if (typeof window !== 'undefined') {
      const cachedLogo = localStorage.getItem('tenant_logo_url');
      const cachedStamp = localStorage.getItem('tenant_stamp_url');
      const cachedSig = localStorage.getItem('tenant_signature_url');
      const cachedSigName = localStorage.getItem('tenant_signatory_name');
      const cachedSigTitle = localStorage.getItem('tenant_signatory_title');
      const cachedTagline = localStorage.getItem('tenant_tagline');

      if (cachedLogo) setCompanyLogo(cachedLogo);
      if (cachedStamp) setCompanyStampUrl(cachedStamp);
      if (cachedSig) setCompanySignatureUrl(cachedSig);
      if (cachedSigName) setSignatoryName(cachedSigName);
      if (cachedSigTitle) setSignatoryTitle(cachedSigTitle);
      if (cachedTagline) setCompanyTagline(cachedTagline);
    }

    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      // 2. Fetch Company Settings
      const res = await fetch('/api/company-settings', { headers, credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (data) {
          const tenantName = data.companyName || data.legalName || data.tenant?.name;
          if (tenantName) setCompanyName(tenantName);
          if (data.logoUrl) setCompanyLogo(data.logoUrl);
          if (data.tagline) setCompanyTagline(data.tagline);
          if (data.address) setCompanyAddress(data.address);
          if (data.email) setCompanyEmail(data.email);
          if (data.website) setCompanyWebsite(data.website);
          if (data.gstin) setCompanyGstin(data.gstin);
          if (data.cinNumber || data.llpin) setCompanyLlpin(data.cinNumber || data.llpin);
          if (data.stampUrl) setCompanyStampUrl(data.stampUrl);
          if (data.digitalSignatureUrl) setCompanySignatureUrl(data.digitalSignatureUrl);
          if (data.signatoryName) setSignatoryName(data.signatoryName);
          if (data.signatoryTitle) setSignatoryTitle(data.signatoryTitle);
          if (data.digitalSignatureEnabled !== undefined && data.digitalSignatureEnabled !== null) {
            setDigitalSignatureEnabled(Boolean(data.digitalSignatureEnabled));
          }
          if (data.bankDetails && typeof data.bankDetails === 'object' && Object.keys(data.bankDetails).length > 0) {
            setBankDetails((prev) => ({ ...prev, ...data.bankDetails }));
          }
        }
      }

      // 3. Fetch Workspace Settings for extended custom fields
      const wsRes = await fetch('/api/workspace-settings', { headers, credentials: 'include' });
      if (wsRes.ok) {
        const wsJson = await wsRes.json();
        const wsData = wsJson.data || wsJson;
        if (wsData) {
          if (wsData.logoUrl) setCompanyLogo(wsData.logoUrl);
          if (wsData.stampUrl) setCompanyStampUrl(wsData.stampUrl);
          if (wsData.digitalSignatureUrl) setCompanySignatureUrl(wsData.digitalSignatureUrl);
          if (wsData.signatoryName) setSignatoryName(wsData.signatoryName);
          if (wsData.signatoryTitle) setSignatoryTitle(wsData.signatoryTitle);
          if (wsData.tagline) setCompanyTagline(wsData.tagline);
          if (wsData.bankDetails && typeof wsData.bankDetails === 'object' && Object.keys(wsData.bankDetails).length > 0) {
            setBankDetails((prev) => ({ ...prev, ...wsData.bankDetails }));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch dynamic company branding:', err);
    }
  };

  const handleInlineUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'stamp' | 'signature' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (target === 'stamp') {
        setCompanyStampUrl(dataUrl);
        setStampEnabled(true);
        if (typeof window !== 'undefined') localStorage.setItem('tenant_stamp_url', dataUrl);
      } else if (target === 'signature') {
        setCompanySignatureUrl(dataUrl);
        setDigitalSignatureEnabled(true);
        if (typeof window !== 'undefined') localStorage.setItem('tenant_signature_url', dataUrl);
      } else if (target === 'logo') {
        setCompanyLogo(dataUrl);
        if (typeof window !== 'undefined') localStorage.setItem('tenant_logo_url', dataUrl);
      }
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', 'avatar');
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/upload', { method: 'POST', headers, body: formData });
      if (res.ok) {
        const json = await res.json();
        const uploadedUrl = json.data?.url || json.url;
        if (uploadedUrl) {
          if (target === 'stamp') {
            setCompanyStampUrl(uploadedUrl);
            if (typeof window !== 'undefined') localStorage.setItem('tenant_stamp_url', uploadedUrl);
          }
          if (target === 'signature') {
            setCompanySignatureUrl(uploadedUrl);
            if (typeof window !== 'undefined') localStorage.setItem('tenant_signature_url', uploadedUrl);
          }
          if (target === 'logo') {
            setCompanyLogo(uploadedUrl);
            if (typeof window !== 'undefined') localStorage.setItem('tenant_logo_url', uploadedUrl);
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('branding-updated', { detail: { target, url: uploadedUrl } }));
          }
        }
      }
      toast.success(`${target === 'stamp' ? 'Corporate Stamp' : target === 'signature' ? 'Signature' : 'Logo'} updated!`);
    } catch {
      toast.info('Using locally uploaded preview image.');
    }
  };

  // 2. Handle Client Selection from Dropdown
  const handleSelectClient = (cid: string) => {
    setSelectedClientId(cid);
    if (!cid) {
      setClientName('');
      setClientAddress('');
      setTaxId('');
      setClientEmail('');
      setContactPerson('');
      setContactNumber('');
      return;
    }
    const found = clients.find((c, idx) => {
      const cIdStr =
        c.id !== undefined && c.id !== null && c.id !== ''
          ? String(c.id)
          : (c.client_id || c.email || `client-${idx}`);
      return cIdStr === cid || String(c.id) === cid || String(c.client_id) === cid || c.email === cid;
    });
    if (found) {
      populateClientFields(found);
      const displayName =
        found.companyName ||
        found.company_name ||
        found.clientName ||
        found.name ||
        found.contactPerson ||
        found.email ||
        'Client';
      toast.success(`Client details for "${displayName}" auto-filled!`);
    }
  };"""

# 5. Update handleReset to clear selectedClientId
old_reset = """  const handleReset = () => {
    setInvoiceType('Advance Payment');"""

new_reset = """  const handleReset = () => {
    setSelectedClientId('');
    setInvoiceType('Advance Payment');"""

# 6. Update JSX for Client select options
old_select_jsx = """                      <select
                        value={selectedClientId}
                        onChange={(e) => handleSelectClient(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-white dark:bg-zinc-850 text-xs font-semibold outline-none border-blue-300 dark:border-blue-800 shadow-sm text-slate-800 dark:text-slate-100"
                      >
                        <option value="">-- Direct / Custom Client Entry --</option>
                        {clients.map((c) => {
                          const company =
                            c.companyName ||
                            c.company_name ||
                            c.contactPerson ||
                            c.contact_person ||
                            c.name ||
                            (c.email ? c.email.split('@')[0] : 'Client');
                          return (
                            <option key={c.id} value={c.id}>
                              {company} {c.email ? `(${c.email})` : ''}
                            </option>
                          );
                        })}
                      </select>"""

new_select_jsx = """                      <select
                        value={selectedClientId}
                        onChange={(e) => handleSelectClient(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-white dark:bg-zinc-850 text-xs font-semibold outline-none border-blue-300 dark:border-blue-800 shadow-sm text-slate-800 dark:text-slate-100"
                      >
                        <option value="">-- Direct / Custom Client Entry --</option>
                        {clients.map((c, idx) => {
                          const cid =
                            c.id !== undefined && c.id !== null && c.id !== ''
                              ? String(c.id)
                              : (c.client_id || c.email || `client-${idx}`);
                          const company =
                            (c.companyName && String(c.companyName).trim()) ||
                            (c.company_name && String(c.company_name).trim()) ||
                            (c.clientName && String(c.clientName).trim()) ||
                            (c.contactPerson && String(c.contactPerson).trim()) ||
                            (c.contact_person && String(c.contact_person).trim()) ||
                            (c.name && String(c.name).trim()) ||
                            (c.email ? String(c.email).split('@')[0] : 'Client');
                          const emailDisplay = c.email ? `(${c.email})` : '';
                          return (
                            <option key={cid} value={cid}>
                              {company} {emailDisplay}
                            </option>
                          );
                        })}
                      </select>"""

assert old_mount_effect in content, "old_mount_effect not found"
content = content.replace(old_mount_effect, new_mount_effect, 1)

assert old_load_inv in content, "old_load_inv not found"
content = content.replace(old_load_inv, new_load_inv, 1)

assert old_populate_and_fetch in content, "old_populate_and_fetch not found"
content = content.replace(old_populate_and_fetch, new_populate_and_fetch, 1)

assert old_company_settings in content, "old_company_settings not found"
content = content.replace(old_company_settings, new_company_settings, 1)

assert old_reset in content, "old_reset not found"
content = content.replace(old_reset, new_reset, 1)

assert old_select_jsx in content, "old_select_jsx not found"
content = content.replace(old_select_jsx, new_select_jsx, 1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("patch_invoice_generator.py applied successfully!")

