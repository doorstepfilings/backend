/* Auto-generated from D:/wamp64/www/doorstepfilings/database/seeders/ServicesSeeder.php. Run `npm run seed:extract-legacy-services` to refresh. */

const servicesSeedData = [
    {
        "category": "Startup Desk",
        "slug": "startup-desk",
        "icon": "fa-rocket",
        "description": "Begin your entrepreneurial journey with confidence. We provide end-to-end support for choosing the right business entity — from a simple Sole Proprietorship to a fully incorporated Private Limited Company. Our team handles all government filings, MCA portal submissions, name approval, PAN/TAN allocation, and ensures you receive all foundational legal documents to become operational fast. Whether you are a first-time entrepreneur or expanding your venture, we make the process seamless, transparent, and affordable.",
        "services": [
            {
                "name": "Proprietorship",
                "price": 499,
                "short_description": "Start your solo business instantly with a Proprietorship — the simplest and most affordable structure.",
                "description": "A Sole Proprietorship is the easiest way to start a business in India, where a single individual owns and manages the entire venture. It requires no formal entity registration and is ideal for small traders, freelancers, and local shop owners. We assist with all related registrations like GST, MSME, and business bank account setup.",
                "faqs": [
                    {
                        "question": "Who should register as a Proprietorship?",
                        "answer": "Any individual starting a small business or freelancing career is best suited for this structure."
                    },
                    {
                        "question": "Is a separate bank account required?",
                        "answer": "Yes, maintaining a current account in the business name is strongly recommended for clear financial records."
                    },
                    {
                        "question": "Does a proprietorship provide limited liability?",
                        "answer": "No, the owner has unlimited personal liability for all business debts and obligations."
                    },
                    {
                        "question": "Can a proprietorship be converted later?",
                        "answer": "Yes, it can be converted to a partnership or private limited company as the business grows."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "PAN Card",
                        "description": "PAN of the proprietor",
                        "is_required": true
                    },
                    {
                        "name": "Aadhaar Card",
                        "description": "Aadhaar of the proprietor",
                        "is_required": true
                    },
                    {
                        "name": "Office Address Proof",
                        "description": "Utility bill or rent agreement for business premises",
                        "is_required": true
                    },
                    {
                        "name": "Passport Size Photo",
                        "description": "Recent passport-size photograph of the proprietor",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Partnership",
                "price": 999,
                "short_description": "Register your Partnership Firm with a legally binding agreement between two or more partners.",
                "description": "A Partnership Firm is a business structure where two or more individuals agree to share profits and responsibilities. A formal partnership deed is drafted and registered with the Registrar of Firms, giving the business legal recognition. We handle everything from deed drafting to government registration and PAN application for the firm.",
                "faqs": [
                    {
                        "question": "What is a partnership deed?",
                        "answer": "It is a legal document outlining each partner's rights, duties, profit-sharing ratio, and other terms of operation."
                    },
                    {
                        "question": "Is registration of a partnership firm compulsory?",
                        "answer": "No, but registration is strongly recommended to enjoy full legal rights and be able to sue third parties."
                    },
                    {
                        "question": "What is the minimum number of partners?",
                        "answer": "A minimum of two partners are required to form a partnership."
                    },
                    {
                        "question": "What is the maximum number of partners?",
                        "answer": "Up to 50 partners are allowed in a general partnership firm."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "PAN Card (all partners)",
                        "description": "PAN card of each partner",
                        "is_required": true
                    },
                    {
                        "name": "Aadhaar Card (all partners)",
                        "description": "Aadhaar of each partner",
                        "is_required": true
                    },
                    {
                        "name": "Partnership Deed",
                        "description": "Signed deed on stamp paper",
                        "is_required": true
                    },
                    {
                        "name": "Office Address Proof",
                        "description": "Utility bill or rent agreement",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "One Person Company (OPC)",
                "price": 4999,
                "short_description": "Enjoy limited liability as a solo founder with a One Person Company structure.",
                "description": "A One Person Company (OPC) allows a solo entrepreneur to run a company with limited liability — combining the simplicity of a proprietorship with the legal credibility of a private limited company. OPCs have a separate legal identity and can hold assets in their own name. We handle MCA registration, DSC, DIN, and all mandatory compliance filings.",
                "faqs": [
                    {
                        "question": "Who can form an OPC?",
                        "answer": "Only an Indian resident (natural person) who is a citizen of India can form an OPC."
                    },
                    {
                        "question": "Does OPC require a nominee?",
                        "answer": "Yes, one nominee must be named at the time of incorporation who will take over if the owner is incapacitated."
                    },
                    {
                        "question": "Can an OPC be converted to a private company?",
                        "answer": "Yes, once the turnover or paid-up capital exceeds prescribed thresholds, conversion is mandatory."
                    },
                    {
                        "question": "How many directors can an OPC have?",
                        "answer": "An OPC must have at least one director and can have up to 15 directors."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "PAN Card",
                        "description": "PAN of the director/owner",
                        "is_required": true
                    },
                    {
                        "name": "Aadhaar Card",
                        "description": "Aadhaar of the director/owner",
                        "is_required": true
                    },
                    {
                        "name": "Proof of Identity",
                        "description": "Passport or Voter ID",
                        "is_required": true
                    },
                    {
                        "name": "Bank Statement",
                        "description": "Latest 2 months bank statement",
                        "is_required": true
                    },
                    {
                        "name": "Office Address Proof",
                        "description": "Utility bill for registered office",
                        "is_required": true
                    },
                    {
                        "name": "Passport Size Photo",
                        "description": "Recent photograph",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Limited Liability Partnership (LLP)",
                "price": 4999,
                "short_description": "Form an LLP with the flexibility of a partnership and the safety of limited liability.",
                "description": "A Limited Liability Partnership (LLP) is a hybrid business structure ideal for professionals and small-to-medium businesses. Partners enjoy limited liability protection, meaning personal assets remain safe from business debts. LLPs have fewer compliance requirements than private limited companies. We assist with DPIN, DSC, LLP agreement drafting, and MCA registration.",
                "faqs": [
                    {
                        "question": "What is the minimum requirement for an LLP?",
                        "answer": "A minimum of two designated partners are required, and at least one must be a resident of India."
                    },
                    {
                        "question": "Does an LLP need an complianceor?",
                        "answer": "Compliance is required only if turnover exceeds ₹40 lakh or capital contribution exceeds ₹25 lakh."
                    },
                    {
                        "question": "Can an LLP raise equity funding?",
                        "answer": "No, LLPs cannot issue shares and are generally not preferred by venture capital investors."
                    },
                    {
                        "question": "What annual filings are required?",
                        "answer": "LLPs must file Form 8 (Statement of Accounts) and Form 11 (Annual Return) annually with the MCA."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "PAN Card (all partners)",
                        "description": "PAN of designated partners",
                        "is_required": true
                    },
                    {
                        "name": "Aadhaar Card",
                        "description": "Aadhaar of all partners",
                        "is_required": true
                    },
                    {
                        "name": "Office Address Proof",
                        "description": "Utility bill for registered office",
                        "is_required": true
                    },
                    {
                        "name": "Digital Signature Certificate",
                        "description": "DSC for designated partners",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Private Limited Company",
                "price": 4999,
                "short_description": "Incorporate a Private Limited Company — the most trusted structure for startups and growing businesses.",
                "description": "A Private Limited Company is the preferred choice for businesses seeking investment, credibility, and structured growth. It offers limited liability to shareholders, a separate legal identity, and the ability to issue shares. We handle complete incorporation including MCA filing, DSC, DIN, MOA & AOA drafting, and the certificate of incorporation.",
                "faqs": [
                    {
                        "question": "What is the minimum capital required?",
                        "answer": "There is no mandatory minimum paid-up capital requirement for private limited companies currently."
                    },
                    {
                        "question": "How many directors are required?",
                        "answer": "A minimum of two directors and two shareholders are required to incorporate."
                    },
                    {
                        "question": "Can foreigners invest in a Private Limited Company?",
                        "answer": "Yes, Foreign Direct Investment (FDI) is allowed in most sectors under applicable RBI and FEMA rules."
                    },
                    {
                        "question": "What are the ongoing compliance requirements?",
                        "answer": "Annual ROC return filings, board meetings, income tax return, statutory compliance, and DIN KYC are all mandatory."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "PAN Card",
                        "description": "PAN of all directors and shareholders",
                        "is_required": true
                    },
                    {
                        "name": "Aadhaar Card",
                        "description": "Aadhaar of all directors",
                        "is_required": true
                    },
                    {
                        "name": "Proof of Identity",
                        "description": "Passport or Voter ID for each director",
                        "is_required": true
                    },
                    {
                        "name": "Bank Statement",
                        "description": "Latest 2 months bank statement",
                        "is_required": true
                    },
                    {
                        "name": "Office Address Proof",
                        "description": "Utility bill or rent agreement",
                        "is_required": true
                    },
                    {
                        "name": "NOC from property owner",
                        "description": "If office is rented, NOC from landlord is required",
                        "is_required": false
                    }
                ]
            }
        ]
    },
    {
        "category": "Registration Desk",
        "slug": "registrations-desk",
        "icon": "fa-id-card",
        "description": "Navigate complex regulatory requirements effortlessly. From food safety certifications (FSSAI) and Startup India recognition to digital signatures, trade licenses, and import-export codes — we manage registrations across multiple government portals, ensuring timely approvals and accurate documentation. Our team coordinates with the relevant authorities so you can stay compliant while focusing on business growth. We cover everything from basic MSME Udyam registration to advanced international trade codes and ISO certification.",
        "services": [
            {
                "name": "Startup India Registration",
                "price": 4999,
                "short_description": "Get DPIIT recognition and unlock tax exemptions, government grants, and startup benefits.",
                "description": "Startup India Recognition from DPIIT grants your startup a host of benefits including a 3-year income tax holiday, self-certification for labour and environment compliance, fast-track patent processing, and access to government funds. Eligible startups must be incorporated less than 10 years ago with annual turnover below ₹100 crore. We guide you from eligibility check to DPIIT portal submission and certificate issuance.",
                "faqs": [
                    {
                        "question": "What is the eligibility for Startup India Recognition?",
                        "answer": "The entity must be a private limited company, LLP, or registered partnership, incorporated within the last 10 years, with turnover below ₹100 crore and working on innovation."
                    },
                    {
                        "question": "What is the tax benefit?",
                        "answer": "Recognized startups can claim 100% income tax exemption for 3 consecutive years out of the first 10 years of operation."
                    },
                    {
                        "question": "How long does the recognition process take?",
                        "answer": "Recognition is typically granted within 2-3 business days after successful document submission on the DPIIT portal."
                    },
                    {
                        "question": "Does the company need to be a private limited company?",
                        "answer": "No, LLPs and registered partnership firms are also eligible for Startup India recognition."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Certificate of Incorporation",
                        "description": "Company/LLP registration certificate",
                        "is_required": true
                    },
                    {
                        "name": "PAN Card",
                        "description": "PAN of the entity",
                        "is_required": true
                    },
                    {
                        "name": "Business Brief / Pitch Deck",
                        "description": "Description of innovative product/service",
                        "is_required": true
                    },
                    {
                        "name": "Proof of Innovation",
                        "description": "Patent, awards, or validation proof",
                        "is_required": false
                    }
                ]
            },
            {
                "name": "Trade License",
                "price": 1499,
                "short_description": "Obtain a mandatory Trade License from your local municipality to operate your business legally.",
                "description": "A Trade License is issued by local municipal authorities and is required for most businesses to legally operate within a specific geographical area. It confirms that business activities comply with local health and safety norms. The license requires annual renewal. We manage the complete application process, document submission, and follow-up with local municipal offices on your behalf.",
                "faqs": [
                    {
                        "question": "Who needs a Trade License?",
                        "answer": "Any shop, trading establishment, restaurant, factory, or business operating locally typically requires a trade license."
                    },
                    {
                        "question": "Is the license business-specific?",
                        "answer": "Yes, different categories exist for shops, food establishments, industrial units, and entertainment businesses."
                    },
                    {
                        "question": "How often must it be renewed?",
                        "answer": "Trade licenses generally need to be renewed annually before the expiry date."
                    },
                    {
                        "question": "What happens without a trade license?",
                        "answer": "Operating without a trade license can result in fines, penalties, and even forced closure of the business."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Aadhaar Card",
                        "description": "Identity proof of the applicant",
                        "is_required": true
                    },
                    {
                        "name": "Business Address Proof",
                        "description": "Utility bill or rent agreement for premises",
                        "is_required": true
                    },
                    {
                        "name": "NOC from Landlord",
                        "description": "If premises is rented",
                        "is_required": true
                    },
                    {
                        "name": "Passport Size Photo",
                        "description": "Recent photo of the applicant",
                        "is_required": true
                    },
                    {
                        "name": "PAN Card",
                        "description": "PAN of the business owner",
                        "is_required": false
                    }
                ]
            },
            {
                "name": "FSSAI Registration",
                "price": 499,
                "short_description": "Mandatory food safety registration for small food businesses with turnover below ₹12 lakh.",
                "description": "FSSAI Registration is compulsory for all food business operators with an annual turnover below ₹12 lakh, including home-based caterers, small restaurants, hawkers, and petty food retailers. We handle the complete online registration process, including document preparation and submission on the FSSAI portal, ensuring a smooth and quick approval.",
                "faqs": [
                    {
                        "question": "Who needs FSSAI Registration vs License?",
                        "answer": "Businesses with turnover below ₹12 lakh need Registration; those above ₹12 lakh need a State or Central FSSAI License."
                    },
                    {
                        "question": "What is the validity of FSSAI Registration?",
                        "answer": "It is valid for 1 to 5 years depending on the duration selected at the time of application."
                    },
                    {
                        "question": "Can I operate without FSSAI?",
                        "answer": "No, all food businesses must have at least basic FSSAI registration to legally operate and sell food products."
                    },
                    {
                        "question": "What is the penalty for non-compliance?",
                        "answer": "Operating a food business without FSSAI registration can attract fines up to ₹5 lakh."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Passport Size Photo",
                        "description": "Recent photo of the applicant",
                        "is_required": true
                    },
                    {
                        "name": "PAN Card",
                        "description": "PAN of the food business operator",
                        "is_required": true
                    },
                    {
                        "name": "Aadhaar Card",
                        "description": "Identity proof",
                        "is_required": true
                    },
                    {
                        "name": "Business Address Proof",
                        "description": "Utility bill or rent agreement",
                        "is_required": true
                    },
                    {
                        "name": "List of Food Products",
                        "description": "Nature of food activities being undertaken",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "FSSAI License",
                "price": 2499,
                "short_description": "Get a State or Central FSSAI License for medium and large food businesses across India.",
                "description": "Food businesses with an annual turnover between ₹12 lakh and ₹20 crore require a State FSSAI License. Businesses above ₹20 crore or operating across multiple states need a Central FSSAI License. Both ensure adherence to food safety, hygiene, and labelling standards. We assist with document preparation, portal submission, and coordinating with food safety officers during the inspection process.",
                "faqs": [
                    {
                        "question": "What is the difference between FSSAI Registration and License?",
                        "answer": "Registration is for very small businesses (turnover below ₹12L), while a License is for medium and large food businesses."
                    },
                    {
                        "question": "How long is the FSSAI License valid?",
                        "answer": "FSSAI licenses are valid for 1 to 5 years and must be renewed before expiry."
                    },
                    {
                        "question": "Is a physical inspection required for the license?",
                        "answer": "Yes, food safety officers may inspect your premises before issuing a license."
                    },
                    {
                        "question": "Can the FSSAI License be transferred to another person?",
                        "answer": "The license can be amended in case of minor changes, but it cannot be transferred to another person."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Identity and Address Proof",
                        "description": "Aadhaar/PAN of the applicant",
                        "is_required": true
                    },
                    {
                        "name": "Business Address Proof",
                        "description": "Utility bill or rent deed for food premises",
                        "is_required": true
                    },
                    {
                        "name": "List of Food Products",
                        "description": "Complete list of products to be manufactured/sold",
                        "is_required": true
                    },
                    {
                        "name": "Layout Plan of Premises",
                        "description": "Blueprint showing processing and storage areas",
                        "is_required": true
                    },
                    {
                        "name": "Food Safety Management Plan",
                        "description": "Documentation of hygiene and safety measures",
                        "is_required": false
                    }
                ]
            },
            {
                "name": "Halal License & Certification",
                "price": null,
                "short_description": "Certify your products as Halal and expand your reach to Muslim consumers in India and abroad.",
                "description": "Halal Certification verifies that a product or service meets the requirements of Islamic law and is permissible for Muslim consumers. It is essential for food manufacturers, restaurants, pharmaceutical companies, and cosmetics businesses targeting Muslim markets domestically or for export to Gulf and Southeast Asian countries. We connect you with recognized Halal certification bodies and guide you through the compliance and certification process.",
                "faqs": [
                    {
                        "question": "Who needs Halal Certification?",
                        "answer": "Food manufacturers, restaurants, pharma companies, and exporters targeting Muslim-majority markets or Gulf countries."
                    },
                    {
                        "question": "How long is the Halal Certificate valid?",
                        "answer": "Typically valid for 1 year, subject to annual compliance and renewal."
                    },
                    {
                        "question": "Does Halal Certification help in exports?",
                        "answer": "Yes, many Gulf and Southeast Asian countries require Halal certification for food and consumer product imports."
                    },
                    {
                        "question": "Who issues Halal Certificates in India?",
                        "answer": "Various government-recognized and internationally accredited bodies issue Halal certificates in India."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Business Registration Proof",
                        "description": "Company/firm registration document",
                        "is_required": true
                    },
                    {
                        "name": "Product/Ingredient List",
                        "description": "Complete list of raw materials and additives used",
                        "is_required": true
                    },
                    {
                        "name": "Manufacturing Process Details",
                        "description": "Step-by-step production flow chart",
                        "is_required": true
                    },
                    {
                        "name": "Lab Test Reports",
                        "description": "Third-party lab reports if available",
                        "is_required": false
                    }
                ]
            },
            {
                "name": "ICEGATE Registration",
                "price": 1999,
                "short_description": "Register on the ICEGATE portal for seamless online customs filing and port-related clearances.",
                "description": "ICEGATE is India's national customs portal that enables electronic filing of import/export documents such as bills of entry and shipping bills. Registration is mandatory for Custom House Agents (CHAs), importers, and exporters who wish to process documentation through Indian ports online. We assist with complete ICEGATE registration, including digital signature integration and account activation.",
                "faqs": [
                    {
                        "question": "Who needs ICEGATE registration?",
                        "answer": "All importers, exporters, and Custom House Agents that file customs documents at Indian ports of entry or exit."
                    },
                    {
                        "question": "Is a DSC required for ICEGATE?",
                        "answer": "Yes, a valid Class-3 Digital Signature Certificate is mandatory for ICEGATE registration."
                    },
                    {
                        "question": "Can I track shipments through ICEGATE?",
                        "answer": "Yes, ICEGATE provides real-time tracking of import and export consignments processed through Indian customs."
                    },
                    {
                        "question": "How long does ICEGATE registration take?",
                        "answer": "Typically 3-5 working days after complete document submission and verification."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "PAN Card",
                        "description": "PAN of the business entity",
                        "is_required": true
                    },
                    {
                        "name": "IEC Certificate",
                        "description": "Import Export Code certificate",
                        "is_required": true
                    },
                    {
                        "name": "Class 3 DSC",
                        "description": "Digital Signature Certificate of the authorized person",
                        "is_required": true
                    },
                    {
                        "name": "Business Registration",
                        "description": "Company/firm registration certificate",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Import Export Code (IEC)",
                "price": 1499,
                "short_description": "Obtain your IEC and start trading internationally with full DGFT recognition.",
                "description": "Import Export Code (IEC) is a 10-digit business identification number issued by DGFT and is mandatory for any business importing or exporting goods and services. No customs clearance or international wire transfer for trade is possible without a valid IEC. We handle the complete DGFT portal application, document preparation, and follow-up until your IEC is issued.",
                "faqs": [
                    {
                        "question": "Is IEC mandatory for all importers and exporters?",
                        "answer": "Yes, every individual or business carrying out import or export activities in India must obtain an IEC."
                    },
                    {
                        "question": "Can an individual (not a company) get an IEC?",
                        "answer": "Yes, individuals can also apply for and hold an Import Export Code."
                    },
                    {
                        "question": "How long is IEC valid?",
                        "answer": "IEC is valid for the lifetime of the entity and does not require periodic renewal. Annual update on DGFT portal is required."
                    },
                    {
                        "question": "Is IEC needed for service exports?",
                        "answer": "For most service exports, IEC may be required; however, some IT-enabled service exporters are exempted."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "PAN Card",
                        "description": "PAN of the individual or business",
                        "is_required": true
                    },
                    {
                        "name": "Aadhaar Card",
                        "description": "Aadhaar for individual applicants",
                        "is_required": true
                    },
                    {
                        "name": "Cancelled Cheque / Bank Certificate",
                        "description": "Bank account proof of the entity",
                        "is_required": true
                    },
                    {
                        "name": "Business Address Proof",
                        "description": "Utility bill or office rent agreement",
                        "is_required": true
                    },
                    {
                        "name": "Passport Size Photo",
                        "description": "Recent colour photograph",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Legal Entity Identifier (LEI) Code",
                "price": 1999,
                "short_description": "Obtain your LEI Code — mandatory for entities involved in large financial and derivative transactions.",
                "description": "A Legal Entity Identifier (LEI) is a 20-character alphanumeric code that uniquely identifies a legal entity in global financial markets. RBI mandates LEI codes for non-individual borrowers with credit limits above ₹5 crore and for participants in OTC derivatives, forex, and government securities markets. We coordinate with the Legal Entity Identifier India Limited (LEIL) for smooth issuance and annual renewal.",
                "faqs": [
                    {
                        "question": "Who mandates LEI in India?",
                        "answer": "The Reserve Bank of India (RBI) requires LEIs for large borrowers and parties in certain financial market transactions."
                    },
                    {
                        "question": "How long is an LEI valid?",
                        "answer": "LEI is valid for one year from the date of issue and must be renewed annually."
                    },
                    {
                        "question": "What happens if we do not have an LEI?",
                        "answer": "Banks and financial institutions may refuse to process large-value transactions without a valid LEI."
                    },
                    {
                        "question": "Can an LEI be transferred between entities?",
                        "answer": "No, an LEI is permanently and uniquely assigned to one legal entity and cannot be transferred."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Business Registration Certificate",
                        "description": "Certificate of incorporation or firm registration",
                        "is_required": true
                    },
                    {
                        "name": "PAN Card",
                        "description": "Entity PAN",
                        "is_required": true
                    },
                    {
                        "name": "Complianceed Financial Statements",
                        "description": "Latest complianceed balance sheet and P&L",
                        "is_required": true
                    },
                    {
                        "name": "Authorized Signatory Details",
                        "description": "Name and designation of the signing authority",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "ISO Registration",
                "price": 2499,
                "short_description": "Enhance business credibility and win larger clients with internationally recognized ISO certification.",
                "description": "ISO Certification validates that your business meets internationally recognized management standards such as ISO 9001 (Quality), ISO 27001 (Information Security), or ISO 14001 (Environment). Certification improves client confidence, enables participation in large tenders, and drives operational efficiency. We guide you through gap analysis, documentation, staff training, and the final certification compliance.",
                "faqs": [
                    {
                        "question": "Is ISO certification mandatory?",
                        "answer": "ISO certification is voluntary, but clients and government tenders often make it a prerequisite."
                    },
                    {
                        "question": "How long does ISO certification last?",
                        "answer": "Certificates are typically valid for 3 years, with annual surveillance compliances conducted in between."
                    },
                    {
                        "question": "What is the most common ISO standard for businesses?",
                        "answer": "ISO 9001 (Quality Management System) is the most widely adopted standard across industries globally."
                    },
                    {
                        "question": "Will there be an on-site compliance?",
                        "answer": "Yes, the certifying body conducts one or more compliances at your premises before issuing the certificate."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Business Registration",
                        "description": "Certificate of incorporation or registration",
                        "is_required": true
                    },
                    {
                        "name": "Organizational Chart",
                        "description": "Structure showing departments and responsibilities",
                        "is_required": true
                    },
                    {
                        "name": "Process Documentation",
                        "description": "Standard operating procedures and work instructions",
                        "is_required": true
                    },
                    {
                        "name": "Quality Manual",
                        "description": "Document defining the quality management scope and policy",
                        "is_required": true
                    },
                    {
                        "name": "Previous Compliance Reports",
                        "description": "If applicable from prior certifications",
                        "is_required": false
                    }
                ]
            },
            {
                "name": "Professional Tax Registration",
                "price": 1999,
                "short_description": "Comply with state-mandated Professional Tax registration for your business and employees.",
                "description": "Professional Tax (PT) is a state-level tax levied on individuals earning salaried income or income from a profession or trade. Employers must deduct PT from employee salaries and remit it to the respective state government. Rules and slabs vary by state. We assist with employer registration and employee enrollment on the state PT portal, and manage monthly or quarterly return filing.",
                "faqs": [
                    {
                        "question": "Is Professional Tax applicable in all states?",
                        "answer": "No, PT is only applicable in states that have enacted their own Professional Tax legislation."
                    },
                    {
                        "question": "Who is responsible for PT deduction?",
                        "answer": "Employers must deduct PT from employees' salaries and deposit it with the state government."
                    },
                    {
                        "question": "What is the maximum PT per year?",
                        "answer": "The Constitution caps Professional Tax at ₹2,500 per year per individual."
                    },
                    {
                        "question": "Is PT applicable to business owners?",
                        "answer": "Yes, self-employed individuals and business owners must also pay PT where the state law applies."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Business Registration",
                        "description": "Company or firm registration certificate",
                        "is_required": true
                    },
                    {
                        "name": "PAN Card",
                        "description": "PAN of the entity",
                        "is_required": true
                    },
                    {
                        "name": "Address Proof",
                        "description": "Office address proof",
                        "is_required": true
                    },
                    {
                        "name": "Employee List with Salary Details",
                        "description": "List of employees and their gross monthly salary",
                        "is_required": true
                    },
                    {
                        "name": "Bank Account Details",
                        "description": "For PT payment",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Digital Signature Certificate (DSC)",
                "price": 699,
                "short_description": "Get a legally valid DSC for secure online document signing and e-government portal access.",
                "description": "A Digital Signature Certificate (DSC) is the electronic equivalent of a handwritten signature and is issued by licensed Certifying Authorities. It is required for income tax filings, GST registration, MCA company registration, DGFT applications, and e-tendering portals. Class 3 DSC is the standard type for high-security transactions. We assist with application, video-based KYC, and USB token delivery.",
                "faqs": [
                    {
                        "question": "What is the validity of a DSC?",
                        "answer": "DSCs are typically valid for 1 or 2 years and can be renewed before expiry."
                    },
                    {
                        "question": "What is the difference between Class 2 and Class 3 DSC?",
                        "answer": "Class 3 DSC offers the highest level of security and is now the only type issued for most government filings."
                    },
                    {
                        "question": "Can a DSC be used on multiple computers?",
                        "answer": "Yes, a DSC stored on a USB token can be used on any computer system."
                    },
                    {
                        "question": "Where is DSC commonly required?",
                        "answer": "MCA filings, DGFT IEC, income tax e-filing, GST, and e-tendering platforms all require a valid DSC."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "PAN Card",
                        "description": "Self-attested PAN of the applicant",
                        "is_required": true
                    },
                    {
                        "name": "Aadhaar Card",
                        "description": "For Aadhaar-based video KYC",
                        "is_required": true
                    },
                    {
                        "name": "Passport Size Photo",
                        "description": "Recent photograph",
                        "is_required": true
                    },
                    {
                        "name": "Mobile Number",
                        "description": "Linked to Aadhaar for OTP verification",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Udyam Registration",
                "price": 499,
                "short_description": "Register your MSME on the Udyam portal and unlock government subsidies, credit schemes, and benefits.",
                "description": "Udyam Registration is the official MSME registration introduced by the Government of India, replacing the earlier Udyog Aadhaar process. It provides businesses with MSME recognition, enabling access to priority sector lending, government subsidies, collateral-free credit, and various state-level incentives. Registration is done online through Aadhaar-based authentication and is completely free on the government portal.",
                "faqs": [
                    {
                        "question": "Who is eligible for Udyam Registration?",
                        "answer": "Micro, Small, and Medium Enterprises as defined by the government's investment and annual turnover criteria."
                    },
                    {
                        "question": "Is Udyam Registration the same as Udyog Aadhaar?",
                        "answer": "No, Udyam Registration replaced Udyog Aadhaar. Existing Udyog Aadhaar holders should migrate to Udyam."
                    },
                    {
                        "question": "Is there any government fee for Udyam Registration?",
                        "answer": "The Government of India does not charge any fee for registration on the Udyam portal."
                    },
                    {
                        "question": "What benefits does MSME registration offer?",
                        "answer": "Benefits include priority sector lending, protection against delayed payments, lower interest rates, and scheme access."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Aadhaar Card of Owner",
                        "description": "Aadhaar-based authentication is mandatory",
                        "is_required": true
                    },
                    {
                        "name": "PAN Card",
                        "description": "PAN of the entity or proprietor",
                        "is_required": true
                    },
                    {
                        "name": "Business Bank Account",
                        "description": "Bank account number and IFSC",
                        "is_required": true
                    },
                    {
                        "name": "GSTIN",
                        "description": "GST number if applicable",
                        "is_required": false
                    }
                ]
            }
        ]
    },
    {
        "category": "Trademark & Intellectual Property Services",
        "slug": "trademark-ip",
        "icon": "fa-copyright",
        "description": "Protect what makes your business unique. Our intellectual property experts conduct prior art searches, prepare trademark applications, and respond to registry objections — ensuring robust legal protection for your logos, brand names, taglines, and creative assets across India and internationally. A registered trademark is valid for 10 years and is your strongest defence against infringement. We also offer expedited filing for businesses requiring faster brand protection.",
        "services": [
            {
                "name": "Trademark Registration",
                "price": 1999,
                "short_description": "Protect your brand name and logo with a legally registered trademark valid for 10 years.",
                "description": "Trademark Registration gives your brand name, logo, tagline, or symbol legal protection and prevents others from using a confusingly similar mark in the same class. A registered trademark is valid for 10 years and is renewable indefinitely. We conduct a prior art search, prepare the application, and file it with the Trade Marks Registry on your behalf.",
                "faqs": [
                    {
                        "question": "How long does trademark registration take?",
                        "answer": "It typically takes 18-24 months for final registration; however, TM-A status is granted immediately on filing."
                    },
                    {
                        "question": "Can I use ™ before registration is complete?",
                        "answer": "Yes, the ™ symbol can be used once an application is filed. The ® symbol is only used after full registration."
                    },
                    {
                        "question": "What is a trademark class?",
                        "answer": "Trademarks are divided into 45 classes based on goods and services. You must file in the correct class for your business."
                    },
                    {
                        "question": "What if someone opposes my trademark?",
                        "answer": "There is a 4-month opposition period after publication in the Trademark Journal; our experts handle opposition responses."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Brand Name / Logo",
                        "description": "Clear image of the mark to be registered",
                        "is_required": true
                    },
                    {
                        "name": "Business Registration Proof",
                        "description": "Certificate of incorporation or firm registration",
                        "is_required": true
                    },
                    {
                        "name": "Applicant Identity Proof",
                        "description": "PAN and Aadhaar of the applicant",
                        "is_required": true
                    },
                    {
                        "name": "List of Goods / Services",
                        "description": "Description of goods or services the mark will cover",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Expedited Trademark Registration",
                "price": 1999,
                "short_description": "Get priority examination of your trademark application for faster brand protection.",
                "description": "Expedited Trademark Registration allows applicants to request priority examination by paying an additional government fee, significantly reducing the examination wait time. This is ideal for businesses launching new products, entering new markets, or facing infringement threats who cannot wait for the standard timeline. Our team prepares and files all documentation for expedited processing.",
                "faqs": [
                    {
                        "question": "How much faster is expedited processing?",
                        "answer": "Expedited applications are typically examined within 1-3 months versus 12+ months for standard applications."
                    },
                    {
                        "question": "Is the protection different for expedited applications?",
                        "answer": "No, the legal protection and certificate issued are identical to a standard trademark registration."
                    },
                    {
                        "question": "Is expedited trademark available for all classes?",
                        "answer": "Yes, expedited filing is available across all 45 trademark classes."
                    },
                    {
                        "question": "What is the additional government fee for expedited filing?",
                        "answer": "The government charges ₹40,000 (or ₹20,000 for individuals/MSMEs) for expedited examination."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Brand Name / Logo",
                        "description": "Clear image of the trademark",
                        "is_required": true
                    },
                    {
                        "name": "Identity Proof",
                        "description": "PAN and Aadhaar of the applicant or business registration",
                        "is_required": true
                    },
                    {
                        "name": "List of Goods / Services",
                        "description": "Specific goods/services the trademark will cover",
                        "is_required": true
                    }
                ]
            }
        ]
    },
    {
        "category": "GST Services",
        "slug": "gst-services",
        "icon": "fa-file-invoice-dollar",
        "description": "Simplify your entire GST management with expert assistance. We cover new GST registration, monthly and annual return filing (GSTR-1, GSTR-3B, GSTR-9), amendments to registration, LUT bond filing for exporters, and revocation of cancelled registrations. Our qualified accountants reconcile your input tax credits, handle GST notices, and keep your business compliance-ready and penalty-free throughout the year. All filings are handled digitally through the GST portal with complete transparency.",
        "services": [
            {
                "name": "GST Registration",
                "price": 1499,
                "short_description": "Register your business for GST and get your GSTIN to collect tax and claim input credits.",
                "description": "GST Registration is mandatory for businesses with annual turnover exceeding ₹20 lakh (₹10 lakh for special category states), for any inter-state supplier, or for e-commerce sellers. Registration gives you a GSTIN (15-digit unique number) enabling you to collect GST, avail input tax credits, and file returns. We handle the complete application on the GST portal.",
                "faqs": [
                    {
                        "question": "When is GST registration mandatory?",
                        "answer": "When turnover exceeds ₹20 lakh, or for inter-state supplies, e-commerce operators, or specific notified categories."
                    },
                    {
                        "question": "How long does GST registration take?",
                        "answer": "Typically 3-7 working days after document submission and Aadhaar authentication."
                    },
                    {
                        "question": "Can a business have multiple GSTINs?",
                        "answer": "Yes, one GSTIN per state is required if you have business operations registered in multiple states."
                    },
                    {
                        "question": "What is the composition scheme?",
                        "answer": "Small businesses with turnover below ₹1.5 crore can opt for a simplified composition scheme at lower tax rates."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "PAN Card",
                        "description": "PAN of the business or proprietor",
                        "is_required": true
                    },
                    {
                        "name": "Aadhaar Card",
                        "description": "For Aadhaar-based e-KYC of the applicant",
                        "is_required": true
                    },
                    {
                        "name": "Business Registration",
                        "description": "Certificate of incorporation or firm registration",
                        "is_required": true
                    },
                    {
                        "name": "Office Address Proof",
                        "description": "Utility bill or rent agreement for principal place of business",
                        "is_required": true
                    },
                    {
                        "name": "Bank Account Details",
                        "description": "Cancelled cheque or bank statement",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "GST Return Filing (by Accountant)",
                "price": null,
                "short_description": "Timely GST return filing by qualified accountants — monthly and annual packages available.",
                "description": "All registered GST taxpayers must file periodic returns including GSTR-1 (sales) and GSTR-3B (monthly summary). Late or incorrect filings attract late fees, interest, and GSTIN suspension. Our qualified accountants manage your complete return filing cycle, reconcile input tax credits, and ensure you remain fully compliant throughout the year.",
                "pricing_plans": [
                    {
                        "name": "Monthly Filing",
                        "price": "999",
                        "features": [
                            "GSTR-1 filing",
                            "GSTR-3B filing",
                            "Monthly ITC reconciliation"
                        ]
                    },
                    {
                        "name": "Annual – Turnover up to ₹25L",
                        "price": "8999",
                        "features": [
                            "All monthly returns",
                            "Annual GSTR-9",
                            "Dedicated accountant"
                        ]
                    },
                    {
                        "name": "Annual – Turnover up to ₹50L",
                        "price": "17999",
                        "features": [
                            "All monthly returns",
                            "Annual GSTR-9",
                            "Priority support"
                        ]
                    }
                ],
                "faqs": [
                    {
                        "question": "What is the penalty for late GST return filing?",
                        "answer": "₹50 per day for returns with tax liability and ₹20 per day for nil returns, plus 18% interest on pending tax."
                    },
                    {
                        "question": "What is GSTR-1?",
                        "answer": "GSTR-1 is the monthly or quarterly statement of outward supplies (sales invoices) filed by the registered taxpayer."
                    },
                    {
                        "question": "What is GSTR-3B?",
                        "answer": "GSTR-3B is a monthly self-declaration return summarising tax liability, input tax credits claimed, and payment made."
                    },
                    {
                        "question": "Can input tax credit be claimed on all purchases?",
                        "answer": "ITC can be claimed on most business purchases, subject to conditions and specific blocked ITC provisions under GST law."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "GSTIN",
                        "description": "Your registered GST Identification Number",
                        "is_required": true
                    },
                    {
                        "name": "Monthly Sales Invoices",
                        "description": "All B2B and B2C sales invoices for the period",
                        "is_required": true
                    },
                    {
                        "name": "Purchase Invoices for ITC",
                        "description": "Invoices for purchases on which ITC is to be claimed",
                        "is_required": true
                    },
                    {
                        "name": "Bank Statements",
                        "description": "For reconciliation purposes",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "GST LUT Form",
                "price": 1499,
                "short_description": "File a GST Letter of Undertaking to export goods and services without paying IGST upfront.",
                "description": "A GST Letter of Undertaking (LUT) is filed by exporters to supply goods and services abroad without paying Integrated GST upfront. Without a valid LUT, exporters must pay IGST first and claim a refund later, or provide a bond with bank guarantee. The LUT must be filed at the start of each financial year. We prepare and submit your LUT on the GST portal promptly.",
                "faqs": [
                    {
                        "question": "Who can file a GST LUT?",
                        "answer": "Any GST-registered exporter who has not been prosecuted for tax evasion exceeding ₹2.5 crore can file an LUT."
                    },
                    {
                        "question": "Is a new LUT needed every year?",
                        "answer": "Yes, a fresh LUT must be filed at the beginning of each financial year on the GST portal."
                    },
                    {
                        "question": "What is the alternative to an LUT for exports?",
                        "answer": "Without an LUT, exporters must pay IGST upfront and claim refund, or execute a bond with bank guarantee."
                    },
                    {
                        "question": "Does LUT cover deemed exports?",
                        "answer": "Yes, LUT can also cover supplies treated as deemed exports under the GST rules."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "GSTIN",
                        "description": "GST registration number",
                        "is_required": true
                    },
                    {
                        "name": "Export Documents",
                        "description": "Previous export invoices or IEC copy",
                        "is_required": true
                    },
                    {
                        "name": "DSC or Aadhaar OTP",
                        "description": "For GST portal authentication",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "GST Annual Return Filing (GSTR-9)",
                "price": 7499,
                "short_description": "File your GSTR-9 Annual Return accurately with expert CA help to summarise full-year GST activity.",
                "description": "GSTR-9 is the annual return consolidating all monthly filings and reconciling the full year's GST transactions. Filing errors or omissions can attract scrutiny and notices from the department. Our chartered accountants carefully review all prior return filings, reconcile purchase and sales registers, and prepare an accurate GSTR-9 submission before the December 31st due date.",
                "faqs": [
                    {
                        "question": "When is GSTR-9 due?",
                        "answer": "The due date is December 31st of the following financial year (e.g., FY 2023-24 is due by December 31, 2024)."
                    },
                    {
                        "question": "Is GSTR-9 mandatory for all GST taxpayers?",
                        "answer": "Mandatory for taxpayers with annual turnover above ₹2 crore; optional for others but advisable."
                    },
                    {
                        "question": "What is GSTR-9C?",
                        "answer": "GSTR-9C is a reconciliation statement certified by a CA, required for taxpayers with turnover above ₹5 crore."
                    },
                    {
                        "question": "Does GSTR-9 correct errors in monthly returns?",
                        "answer": "No, GSTR-9 is a summary form and does not replace corrections that should have been made in monthly returns."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "GSTIN",
                        "description": "GST registration number",
                        "is_required": true
                    },
                    {
                        "name": "All Monthly GSTR-1 and GSTR-3B Filings",
                        "description": "Acknowledgements for all monthly/quarterly returns",
                        "is_required": true
                    },
                    {
                        "name": "Purchase and Sales Ledger",
                        "description": "Full year purchase and sales register",
                        "is_required": true
                    },
                    {
                        "name": "ITC Register",
                        "description": "Input tax credit register for the financial year",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "GST Amendment",
                "price": 999,
                "short_description": "Update or correct your GST registration details such as address, contact, or business information.",
                "description": "Businesses need to amend their GST registration when there are changes in address, authorized signatory, contact details, or addition of a new place of business. Core amendments require officer approval, while non-core amendments like phone or email are auto-approved. We handle the GST portal amendment application and follow up until approval is received.",
                "faqs": [
                    {
                        "question": "What details can be amended in GST registration?",
                        "answer": "Non-core fields like phone, email, bank details, and trade name can be self-amended; core fields need officer approval."
                    },
                    {
                        "question": "How long does a GST amendment take?",
                        "answer": "Non-core amendments are approved instantly; core amendments can take up to 15 working days."
                    },
                    {
                        "question": "What if the amendment application is rejected?",
                        "answer": "You can re-apply with corrected supporting documents after understanding the reason for rejection."
                    },
                    {
                        "question": "Is there a government fee for GST amendments?",
                        "answer": "No, GST amendments are processed free of charge on the government portal."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "GSTIN",
                        "description": "Existing GST registration number",
                        "is_required": true
                    },
                    {
                        "name": "Supporting Document for Change",
                        "description": "New address proof, signatory details, etc.",
                        "is_required": true
                    },
                    {
                        "name": "DSC or Aadhaar OTP",
                        "description": "For portal authentication",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "GST Revocation",
                "price": 2499,
                "short_description": "Revoke a cancelled GST registration and restore your legal ability to do business under GST.",
                "description": "When a GSTIN is cancelled — either by a tax officer or voluntarily — revocation is the formal process to restore it. All pending returns must be filed and outstanding dues cleared before revocation can proceed. The application must be filed within 30 days of the cancellation order. We compile pending returns, prepare the revocation application, and follow up with the tax authority.",
                "faqs": [
                    {
                        "question": "Within what time must revocation be applied for?",
                        "answer": "Within 30 days of the cancellation order, with extensions possible through proper application."
                    },
                    {
                        "question": "What are the prerequisites for revocation?",
                        "answer": "All pending GST returns must be filed and any outstanding tax dues paid before revocation is processed."
                    },
                    {
                        "question": "Can a suo-moto cancellation by an officer be revoked?",
                        "answer": "Yes, taxpayers can apply to revoke a cancellation initiated by the tax officer on their own motion."
                    },
                    {
                        "question": "What if the revocation application is rejected?",
                        "answer": "An appeal can be filed before the GST Appellate Authority against the rejection order."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "GST Cancellation Order",
                        "description": "Copy of the cancellation order received",
                        "is_required": true
                    },
                    {
                        "name": "Pending Return Filing Receipts",
                        "description": "Proof that all pending returns have been filed",
                        "is_required": true
                    },
                    {
                        "name": "Payment Challans",
                        "description": "Proof of outstanding tax payment",
                        "is_required": true
                    },
                    {
                        "name": "Reason for Revocation",
                        "description": "Written explanation for seeking revocation",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "GSTR-10 Filing",
                "price": 1499,
                "short_description": "File the mandatory GSTR-10 final return when your GST registration is cancelled or surrendered.",
                "description": "GSTR-10 is the final GST return filed by a taxpayer whose registration has been cancelled or surrendered. It must be submitted within 3 months of cancellation and captures closing stock details and the ITC required to be reversed. Late filing attracts heavy penalties. We compute the tax on closing stock and submit GSTR-10 accurately and on time.",
                "faqs": [
                    {
                        "question": "Who must file GSTR-10?",
                        "answer": "Any GST-registered taxpayer whose registration has been cancelled or surrendered must file GSTR-10."
                    },
                    {
                        "question": "What is the due date for GSTR-10?",
                        "answer": "Within 3 months of the date of the cancellation order or the date of cancellation, whichever is earlier."
                    },
                    {
                        "question": "What is the late fee for GSTR-10?",
                        "answer": "₹200 per day (₹100 CGST + ₹100 SGST), subject to a maximum late fee of ₹10,000."
                    },
                    {
                        "question": "Must ITC on closing stock be reversed in GSTR-10?",
                        "answer": "Yes, ITC attributable to closing stock must be reversed and the corresponding tax paid while filing GSTR-10."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "GSTIN",
                        "description": "Cancelled GST registration number",
                        "is_required": true
                    },
                    {
                        "name": "Cancellation Order",
                        "description": "Official cancellation order from the GST department",
                        "is_required": true
                    },
                    {
                        "name": "Closing Stock Details",
                        "description": "List and value of stock held on the date of cancellation",
                        "is_required": true
                    },
                    {
                        "name": "Previous Return Acknowledgements",
                        "description": "Filed return receipts for all previous periods",
                        "is_required": true
                    }
                ]
            }
        ]
    },
    {
        "category": "Income Tax Consultancy",
        "slug": "income-tax-services",
        "icon": "fa-file-alt",
        "description": "Maximize deductions and minimize tax liabilities with professional income tax support from our qualified CAs. From straightforward salaried ITR-1 filings to complex business returns with compliance support, TDS quarterly filings, international remittance forms (15CA-15CB), and updated returns (ITR-U), we provide error-free submissions and optimal tax planning tailored to your income profile. We also handle notices, demand resolution, and refund follow-ups to ensure complete peace of mind.",
        "services": [
            {
                "name": "Income Tax E-Filing",
                "price": null,
                "short_description": "File your Income Tax Return accurately with expert CA guidance — salaried or business plans available.",
                "description": "Income Tax Return (ITR) filing is mandatory for individuals and entities whose income exceeds the basic exemption limit. The correct form depends on income type — ITR-1 or ITR-2 for salaried individuals, and ITR-3 or ITR-4 for business income. We assess your income sources, apply all eligible deductions, compute the tax liability, and file your return before the statutory deadline.",
                "pricing_plans": [
                    {
                        "name": "Salaried ITR",
                        "price": "699",
                        "features": [
                            "ITR-1 / ITR-2 filing",
                            "Form 16 processing",
                            "Refund tracking"
                        ]
                    },
                    {
                        "name": "Business ITR (without Accounting)",
                        "price": "1499",
                        "features": [
                            "ITR-3 / ITR-4 filing",
                            "Presumptive income computation",
                            "Deduction optimisation"
                        ]
                    },
                    {
                        "name": "Business ITR (with Accounting)",
                        "price": "2499",
                        "features": [
                            "Full bookkeeping",
                            "P&L and Balance Sheet",
                            "ITR-3 filing with compliance support"
                        ]
                    }
                ],
                "faqs": [
                    {
                        "question": "What is the ITR filing deadline?",
                        "answer": "July 31st for non-compliance cases; October 31st for businesses requiring a tax compliance."
                    },
                    {
                        "question": "What is the late filing fee?",
                        "answer": "A late filing fee under Section 234F of ₹1,000 (income below ₹5L) to ₹5,000 applies, plus interest."
                    },
                    {
                        "question": "What documents are needed for ITR filing?",
                        "answer": "Form 16, Form 26AS, bank statements, investment proof documents, and any TDS certificates."
                    },
                    {
                        "question": "Should I file ITR even with no tax liability?",
                        "answer": "Yes, filing a NIL return is advisable and mandatory in certain cases like foreign travel or high-value transactions."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "PAN Card",
                        "description": "PAN of the taxpayer",
                        "is_required": true
                    },
                    {
                        "name": "Form 16",
                        "description": "TDS certificate from employer for salaried individuals",
                        "is_required": true
                    },
                    {
                        "name": "Bank Statements",
                        "description": "All savings and current account statements for the year",
                        "is_required": true
                    },
                    {
                        "name": "Form 26AS",
                        "description": "Annual tax credit statement from income tax portal",
                        "is_required": true
                    },
                    {
                        "name": "Investment Proofs",
                        "description": "LIC, PPF, ELSS, NPS, home loan certificates for deductions",
                        "is_required": false
                    }
                ]
            },
            {
                "name": "Partnership Firm / LLP / Company ITR Filing",
                "price": 2499,
                "short_description": "Accurate and timely income tax return filing for partnership firms, LLPs, and companies.",
                "description": "Partnership firms, LLPs, and companies must file income tax returns every year regardless of profit or loss. Filing involves preparing financials, computing taxable income, claiming deductions, and submitting the return before the due date. A statutory tax compliance is required if turnover exceeds ₹1 crore (business) or ₹50 lakh (profession). We provide comprehensive return preparation and e-filing.",
                "faqs": [
                    {
                        "question": "Is a tax compliance mandatory for companies?",
                        "answer": "Yes, every company must have its accounts complianceed by a Chartered Accountant under Section 44AB."
                    },
                    {
                        "question": "What is the due date for company ITR?",
                        "answer": "October 31st for entities subject to tax compliance; July 31st for others."
                    },
                    {
                        "question": "Can business losses be carried forward?",
                        "answer": "Business losses can generally be carried forward for up to 8 assessment years for set-off against future profits."
                    },
                    {
                        "question": "What is MAT?",
                        "answer": "Minimum Alternate Tax (MAT) applies where a company's regular tax is less than 15% of its book profit."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "PAN Card",
                        "description": "PAN of the entity",
                        "is_required": true
                    },
                    {
                        "name": "Complianceed P&L and Balance Sheet",
                        "description": "Statutory compliance report and financials",
                        "is_required": true
                    },
                    {
                        "name": "Form 26AS",
                        "description": "Annual tax credit statement",
                        "is_required": true
                    },
                    {
                        "name": "Previous Year Return",
                        "description": "Last year's ITR acknowledgement for reference",
                        "is_required": false
                    }
                ]
            },
            {
                "name": "15CA – 15CB Filing",
                "price": 2499,
                "short_description": "Comply with foreign remittance norms for overseas payments with 15CA and CA-certified 15CB.",
                "description": "Any entity making a payment to a non-resident (foreign individual or company) that is chargeable to tax in India must file Form 15CA online. In specified cases, a CA certificate in Form 15CB must be obtained first. These filings ensure applicable TDS has been deducted before funds are remitted abroad. We coordinate the CA certification and timely income tax portal submission.",
                "faqs": [
                    {
                        "question": "When is Form 15CB required before 15CA?",
                        "answer": "15CB is required when the remittance exceeds ₹5 lakh in a year and is taxable in India."
                    },
                    {
                        "question": "Is 15CA required for all foreign remittances?",
                        "answer": "Most remittances require 15CA; certain exempt categories under Rule 37BB are excluded."
                    },
                    {
                        "question": "Who certifies Form 15CB?",
                        "answer": "A practising Chartered Accountant must certify Form 15CB before it is submitted."
                    },
                    {
                        "question": "What are the TDS rates for foreign payments?",
                        "answer": "Rates depend on the nature of payment and the applicable Double Taxation Avoidance Agreement (DTAA) with the recipient's country."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "PAN Card",
                        "description": "PAN of the remitter",
                        "is_required": true
                    },
                    {
                        "name": "Purpose of Remittance",
                        "description": "Invoice, agreement, or document describing the payment",
                        "is_required": true
                    },
                    {
                        "name": "Bank Details of Recipient",
                        "description": "Foreign bank account details",
                        "is_required": true
                    },
                    {
                        "name": "DTAA Details",
                        "description": "Relevant treaty details between India and recipient country",
                        "is_required": false
                    }
                ]
            },
            {
                "name": "TAN Registration",
                "price": 499,
                "short_description": "Obtain your TAN to legally deduct and deposit TDS as required under the Income Tax Act.",
                "description": "TAN (Tax Deduction and Collection Account Number) is a 10-digit alphanumeric number that is mandatory for all entities required to deduct or collect tax at source. It is quoted on TDS return filings, challans, and certificates like Form 16 and 16A. Failure to obtain TAN attracts a penalty of ₹10,000. We apply through the NSDL portal and ensure prompt issuance.",
                "faqs": [
                    {
                        "question": "Who needs a TAN?",
                        "answer": "Any person or entity required to deduct TDS or collect TCS under the Income Tax Act must obtain a TAN."
                    },
                    {
                        "question": "How is TAN different from PAN?",
                        "answer": "PAN is a general tax identification number; TAN is exclusively for entities with TDS/TCS deduction obligations."
                    },
                    {
                        "question": "Can a company have multiple TANs?",
                        "answer": "A company typically has one TAN; however, different branches or offices may apply for separate TANs."
                    },
                    {
                        "question": "What is the penalty for not having a TAN?",
                        "answer": "Failure to obtain TAN attracts a penalty of ₹10,000 under Section 272BB of the Income Tax Act."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "PAN Card",
                        "description": "PAN of the entity applying for TAN",
                        "is_required": true
                    },
                    {
                        "name": "Aadhaar / Identity Proof",
                        "description": "For individual or proprietor applicants",
                        "is_required": true
                    },
                    {
                        "name": "Business Address Proof",
                        "description": "Office utility bill or rent agreement",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "TDS Return Filing",
                "price": null,
                "short_description": "Timely TDS return filing by experts to avoid penalties, interest, and income tax notices.",
                "description": "All deductors must file quarterly TDS returns (Form 24Q for salary, 26Q for non-salary, 27Q for foreign payments) reporting TDS deducted and deposited. Late filing attracts fees under Section 234E (₹200/day) and prosecution risk. We reconcile challans, prepare accurate returns, and file before due dates, generating Form 16/16A for deductees.",
                "pricing_plans": [
                    {
                        "name": "TDS Return Filing Only",
                        "price": "4999",
                        "features": [
                            "Quarterly TDS return filing",
                            "Challan reconciliation",
                            "Form 16/16A generation"
                        ]
                    },
                    {
                        "name": "TDS Filing with 1-Year Support",
                        "price": "7999",
                        "features": [
                            "All quarters covered",
                            "Notice handling",
                            "Dedicated TDS accountant",
                            "Unlimited revisions"
                        ]
                    }
                ],
                "faqs": [
                    {
                        "question": "What are the quarterly due dates for TDS returns?",
                        "answer": "Q1 by July 31, Q2 by October 31, Q3 by January 31, and Q4 by May 31 of the following year."
                    },
                    {
                        "question": "What happens if TDS is deducted but not deposited?",
                        "answer": "Interest at 1.5% per month applies, plus prosecution provisions are triggered under Section 276B."
                    },
                    {
                        "question": "What is Form 16?",
                        "answer": "Form 16 is the annual TDS certificate issued by employers to employees summarising salary and TDS deducted."
                    },
                    {
                        "question": "Can TDS returns be revised?",
                        "answer": "Yes, revised TDS returns can be filed to correct errors in deductee details, PAN, or challan information."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "TAN",
                        "description": "Tax Deduction Account Number of the deductor",
                        "is_required": true
                    },
                    {
                        "name": "TDS Challan Details",
                        "description": "BSR code, date, and challan serial numbers of deposits made",
                        "is_required": true
                    },
                    {
                        "name": "Deductee PAN and Payment Details",
                        "description": "PAN of each deductee and amount paid/deducted",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Revised ITR Return (ITR-U)",
                "price": null,
                "short_description": "File an Updated Return (ITR-U) to correct mistakes in your original ITR and avoid income tax notices.",
                "description": "The Updated Return (ITR-U) under Section 139(8A) allows taxpayers to file or correct their ITR up to 2 years after the relevant assessment year end, even if no original return was filed. An additional tax of 25% or 50% on the tax differential is payable. We review your original return, identify errors or omissions, and prepare the most accurate and penalty-minimising updated return.",
                "pricing_plans": [
                    {
                        "name": "Salaried ITR-U",
                        "price": "699",
                        "features": [
                            "ITR-U for salary income",
                            "Additional tax computation",
                            "E-filing"
                        ]
                    },
                    {
                        "name": "Business ITR-U (without Accounting)",
                        "price": "1499",
                        "features": [
                            "ITR-U for business income",
                            "Presumptive computation"
                        ]
                    },
                    {
                        "name": "Business ITR-U (with Accounting)",
                        "price": "2499",
                        "features": [
                            "Full bookkeeping review",
                            "ITR-U with P&L preparation"
                        ]
                    }
                ],
                "faqs": [
                    {
                        "question": "What is the time limit for filing ITR-U?",
                        "answer": "ITR-U can be filed within 2 years from the end of the relevant assessment year."
                    },
                    {
                        "question": "Can ITR-U be filed if no original return was filed?",
                        "answer": "Yes, ITR-U can be filed even if no original or belated return was previously submitted."
                    },
                    {
                        "question": "What is the additional tax for ITR-U?",
                        "answer": "25% additional tax on the tax difference if filed within 12 months; 50% if filed between 12-24 months."
                    },
                    {
                        "question": "Can ITR-U reduce my tax liability or claim a refund?",
                        "answer": "No, ITR-U cannot be used to reduce existing tax liability or claim or increase a refund."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "PAN Card",
                        "description": "PAN of the taxpayer",
                        "is_required": true
                    },
                    {
                        "name": "Original ITR Acknowledgement",
                        "description": "If an original return was filed",
                        "is_required": false
                    },
                    {
                        "name": "All Income Proofs",
                        "description": "Salary slips, business income records, capital gain statements",
                        "is_required": true
                    },
                    {
                        "name": "Reason for Update",
                        "description": "Nature of income omitted or error to be corrected",
                        "is_required": true
                    }
                ]
            }
        ]
    },
    {
        "category": "ROC / MCA Compliance Services",
        "slug": "mca-services",
        "icon": "fa-building",
        "description": "Keep your entity in good standing with the Ministry of Corporate Affairs. Our company secretaries and legal experts handle annual filings (AOC-4, MGT-7, Form 11), director KYC, structural changes (name change, registered office, capital increase), share transfers, and complete closure processes. From DIN activation to winding up, we manage the entire corporate lifecycle to help you avoid penalties, director disqualification, and company strike-off.",
        "services": [
            {
                "name": "Company Compliance",
                "price": null,
                "short_description": "Stay compliant with all annual ROC filings and avoid penalties or company strike-off.",
                "description": "Every private limited company must fulfil a set of annual compliance requirements including board meetings, annual general meetings, filing of annual returns (MGT-7), financial statements (AOC-4), and an complianceor's report. Non-compliance leads to heavy penalties and can result in the company being struck off the MCA register. Our company secretaries manage your entire compliance calendar.",
                "faqs": [
                    {
                        "question": "What are the key annual compliances for a company?",
                        "answer": "Board meetings, AGM, filing AOC-4 (financials), MGT-7 (annual return), statutory compliance, and income tax return."
                    },
                    {
                        "question": "What is the penalty for non-compliance?",
                        "answer": "Penalties range from ₹100/day per form to heavy fines and disqualification of directors for repeated defaults."
                    },
                    {
                        "question": "How many board meetings must a company hold?",
                        "answer": "A minimum of 4 board meetings per year with a gap of not more than 120 days between two consecutive meetings."
                    },
                    {
                        "question": "Is the AGM mandatory for private limited companies?",
                        "answer": "Yes, the AGM must be held within 6 months of the end of the financial year (by September 30th)."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "CIN",
                        "description": "Company Identification Number",
                        "is_required": true
                    },
                    {
                        "name": "Complianceed Financial Statements",
                        "description": "Balance sheet and P&L for the financial year",
                        "is_required": true
                    },
                    {
                        "name": "Board Meeting Minutes",
                        "description": "Minutes of all board meetings held during the year",
                        "is_required": true
                    },
                    {
                        "name": "Director Details",
                        "description": "DIN and details of all directors",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "LLP Compliance",
                "price": null,
                "short_description": "Meet all annual LLP compliance obligations — Form 8, Form 11, and income tax filings.",
                "description": "Every LLP registered with MCA must file its annual compliance consisting of Form 11 (Annual Return of LLP), Form 8 (Statement of Account and Solvency), and the income tax return. LLPs with turnover above ₹40 lakh or capital above ₹25 lakh require a statutory compliance. Non-filing attracts daily late fees. We manage your complete LLP compliance calendar seamlessly.",
                "faqs": [
                    {
                        "question": "What forms must an LLP file annually?",
                        "answer": "Form 11 (Annual Return) by May 30th and Form 8 (Solvency Statement) by October 30th each year."
                    },
                    {
                        "question": "Is compliance mandatory for all LLPs?",
                        "answer": "Compliance is required only if turnover exceeds ₹40 lakh or capital contribution exceeds ₹25 lakh."
                    },
                    {
                        "question": "What is the late fee for LLP forms?",
                        "answer": "₹100 per day per form with no upper cap, making timely filing critically important."
                    },
                    {
                        "question": "Can an LLP be struck off for non-compliance?",
                        "answer": "Yes, the Registrar can initiate strike-off proceedings against LLPs that fail to file returns for 2 or more years."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "LLP Identification Number (LLPIN)",
                        "description": "Unique registration number of the LLP",
                        "is_required": true
                    },
                    {
                        "name": "Statement of Accounts",
                        "description": "Profit & Loss and Balance Sheet for the year",
                        "is_required": true
                    },
                    {
                        "name": "Partner Details",
                        "description": "DPIN/DIN and contribution details of all partners",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "OPC Compliance",
                "price": null,
                "short_description": "Keep your One Person Company fully compliant with annual ROC and tax obligations.",
                "description": "One Person Companies must fulfil annual compliance requirements including filing of financial statements in AOC-4, annual return in MGT-7A, statutory compliance, and income tax return. Unlike private limited companies, OPCs need not hold an Annual General Meeting. Our team ensures all your OPC filings are submitted accurately and on time, keeping your company in good standing.",
                "faqs": [
                    {
                        "question": "Does an OPC need to hold an AGM?",
                        "answer": "No, OPCs are exempt from holding an Annual General Meeting (AGM)."
                    },
                    {
                        "question": "Is statutory compliance mandatory for an OPC?",
                        "answer": "Yes, all OPCs must get their accounts complianceed by a Chartered Accountant annually."
                    },
                    {
                        "question": "What is MGT-7A for OPC?",
                        "answer": "MGT-7A is a simplified annual return form for OPCs and small companies, due within 60 days of the end of the financial year."
                    },
                    {
                        "question": "Are there any exemptions for OPCs compared to Pvt Ltd?",
                        "answer": "Yes, OPCs are exempt from AGM requirement and have fewer board meeting requirements."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "CIN",
                        "description": "Company Identification Number of the OPC",
                        "is_required": true
                    },
                    {
                        "name": "Complianceed Financial Statements",
                        "description": "Signed compliance report with balance sheet and P&L",
                        "is_required": true
                    },
                    {
                        "name": "Director DIN",
                        "description": "Director Identification Number",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Company Name Change",
                "price": null,
                "short_description": "Legally change your company name through MCA with full resolution and ROC filing support.",
                "description": "Changing a company's name requires passing a special resolution by shareholders, obtaining central government approval (if required), and filing Form INC-24 with the MCA to receive a new Certificate of Incorporation. The new name must comply with naming guidelines and must not conflict with existing trademarks. We handle name availability checks, resolution drafting, and all MCA filings.",
                "faqs": [
                    {
                        "question": "What is the process to change a company name?",
                        "answer": "Board resolution → EGM special resolution → MGT-14 filing → INC-24 application → new Certificate of Incorporation."
                    },
                    {
                        "question": "How long does a company name change take?",
                        "answer": "Typically 15-30 days from the date of filing the application with the ROC."
                    },
                    {
                        "question": "Is there any restriction on the new name?",
                        "answer": "The new name must not be identical or similar to an existing company, LLP, or a registered trademark."
                    },
                    {
                        "question": "Does the company's CIN change after a name change?",
                        "answer": "No, only the name portion of the CIN changes; the registration number remains the same."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Board Resolution",
                        "description": "Certified copy of board resolution approving the name change",
                        "is_required": true
                    },
                    {
                        "name": "Special Resolution (EGM Minutes)",
                        "description": "Shareholder approval for name change",
                        "is_required": true
                    },
                    {
                        "name": "Existing Certificate of Incorporation",
                        "description": "Current incorporation certificate",
                        "is_required": true
                    },
                    {
                        "name": "MOA and AOA",
                        "description": "Updated after name change is approved",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Registered Office Change",
                "price": null,
                "short_description": "Change your company registered office address with full ROC compliance and filing support.",
                "description": "A company's registered office is its official address on record with the MCA. Changing it requires board or shareholder approval depending on whether the change is within the same city, to another city in the same state, or across states. The relevant forms (INC-22, MGT-14, INC-23) must be filed with the ROC. We draft all resolutions and manage the complete filing process.",
                "faqs": [
                    {
                        "question": "What approvals are needed for a registered office change?",
                        "answer": "Same city: board resolution; different city or state: shareholder special resolution and ROC/CLB approval."
                    },
                    {
                        "question": "How long does the registered office change take?",
                        "answer": "Within the same state typically takes 7-15 days; inter-state changes may take 30-60 days."
                    },
                    {
                        "question": "What documents are required for proof of new address?",
                        "answer": "Utility bill not older than 2 months and an NOC from the property owner if the premises is rented."
                    },
                    {
                        "question": "Must clients and vendors be informed of the address change?",
                        "answer": "Yes, all stakeholders, including banks, tax authorities, and business partners, should be notified."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Board Resolution",
                        "description": "Resolution approving the office change",
                        "is_required": true
                    },
                    {
                        "name": "New Address Proof",
                        "description": "Utility bill (electricity/water) not older than 2 months",
                        "is_required": true
                    },
                    {
                        "name": "NOC from Property Owner",
                        "description": "If the new office is rented",
                        "is_required": true
                    },
                    {
                        "name": "CIN",
                        "description": "Company Identification Number",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "DIN eKYC Filing",
                "price": null,
                "short_description": "Keep your Director Identification Number active with mandatory annual eKYC filing.",
                "description": "The MCA mandates annual DIR-3 KYC filing for every person holding a DIN (Director Identification Number) to keep it active. The filing includes submitting updated personal details, mobile number, and email verified through OTP. Failure to file before September 30th deactivates the DIN, requiring a reactivation fee. We file your DIN KYC quickly and accurately.",
                "pricing_plans": [
                    {
                        "name": "Single DIN eKYC",
                        "price": "999",
                        "features": [
                            "DIR-3 KYC filing for one DIN",
                            "OTP-based verification",
                            "Same-day processing"
                        ]
                    },
                    {
                        "name": "Dual DIN eKYC",
                        "price": "1699",
                        "features": [
                            "DIR-3 KYC filing for two DINs",
                            "OTP-based verification",
                            "Bulk discount"
                        ]
                    }
                ],
                "faqs": [
                    {
                        "question": "What is the due date for DIN eKYC filing?",
                        "answer": "September 30th every year. Filing after this date deactivates the DIN."
                    },
                    {
                        "question": "What happens if DIN KYC is not filed on time?",
                        "answer": "The DIN is marked inactive, and a ₹5,000 reactivation fee applies along with a late filing fee."
                    },
                    {
                        "question": "Can a foreign national director file DIN KYC?",
                        "answer": "Yes, foreign nationals can file DIR-3 KYC using their passport as identity proof."
                    },
                    {
                        "question": "Is DIN KYC the same as company compliance?",
                        "answer": "No, DIN KYC is an individual director obligation and is separate from company-level annual compliances."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "DIN Number",
                        "description": "Director Identification Number to be KYC-verified",
                        "is_required": true
                    },
                    {
                        "name": "PAN Card",
                        "description": "PAN of the director",
                        "is_required": true
                    },
                    {
                        "name": "Aadhaar Card",
                        "description": "Linked Aadhaar for OTP-based verification",
                        "is_required": true
                    },
                    {
                        "name": "Personal Email and Mobile",
                        "description": "Unique email and phone not used by another DIN",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "DIN Reactivation",
                "price": null,
                "short_description": "Reactivate a deactivated DIN and restore director status through DIR-3 KYC filing.",
                "description": "A DIN that has been deactivated due to non-filing of annual KYC can be reactivated by filing the DIR-3 KYC form along with the prescribed late fee. We prepare the filing quickly to help directors resume their compliance activities without further delay.",
                "faqs": [
                    {
                        "question": "What is the fee for DIN reactivation?",
                        "answer": "A ₹5,000 fee is charged by MCA for reactivating a deactivated DIN."
                    },
                    {
                        "question": "How long does DIN reactivation take?",
                        "answer": "Typically processed within 1-2 working days after form submission and fee payment."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "DIN Number",
                        "description": "Deactivated DIN to be reactivated",
                        "is_required": true
                    },
                    {
                        "name": "PAN and Aadhaar",
                        "description": "Identity documents for KYC",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Director Change",
                "price": null,
                "short_description": "Add or change directors in your company with proper MCA filings and board resolutions.",
                "description": "Appointing a new director requires a board resolution, obtaining Director Identification Number (DIN) if not already held, and filing Form DIR-12 with the MCA within 30 days. We manage the complete process from DIN application to ROC filing and certificate issuance.",
                "faqs": [
                    {
                        "question": "What form is used to appoint a director?",
                        "answer": "Form DIR-12 must be filed with the ROC within 30 days of the director's appointment."
                    },
                    {
                        "question": "Is shareholder approval needed?",
                        "answer": "Additional directors can be appointed by the board; regular directors require shareholder approval at the AGM."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Board Resolution",
                        "description": "Resolution for appointment",
                        "is_required": true
                    },
                    {
                        "name": "DIN of New Director",
                        "description": "Director Identification Number",
                        "is_required": true
                    },
                    {
                        "name": "DIR-2 Consent Letter",
                        "description": "Written consent from the new director",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Director Removal",
                "price": null,
                "short_description": "Lawfully remove a director with proper MCA filings and statutory notices.",
                "description": "Removing a director under the Companies Act requires a special notice to the director and shareholders, an opportunity for the director to be heard, and an ordinary resolution passed at a general meeting. Form DIR-12 must be filed with the ROC. We prepare all documents and manage the MCA filings.",
                "faqs": [
                    {
                        "question": "Can a director be removed without cause?",
                        "answer": "Yes, shareholders can remove a director before the expiry of their term by passing an ordinary resolution."
                    },
                    {
                        "question": "How much notice must be given?",
                        "answer": "A special notice of at least 14 days must be given to both the director and the shareholders."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Special Notice",
                        "description": "Notice of intention to remove the director",
                        "is_required": true
                    },
                    {
                        "name": "Board and Shareholder Resolution",
                        "description": "Resolutions from board and EGM",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "ADT-1 Filing",
                "price": null,
                "short_description": "File Form ADT-1 to inform the ROC about your company's newly appointed statutory complianceor.",
                "description": "Form ADT-1 is filed with the MCA to intimate the Registrar of Companies about the appointment or reappointment of a statutory complianceor. It must be filed within 15 days of the AGM at which the complianceor is appointed. We ensure timely and accurate filing to avoid penalties.",
                "faqs": [
                    {
                        "question": "When is ADT-1 required?",
                        "answer": "Within 15 days of the AGM at which the complianceor is appointed or reappointed."
                    },
                    {
                        "question": "Is ADT-1 required every year?",
                        "answer": "No, only when a new complianceor is appointed or on change of complianceor for a new five-year term."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Board and AGM Resolution",
                        "description": "Appointment resolution",
                        "is_required": true
                    },
                    {
                        "name": "Complianceor Consent Letter",
                        "description": "Written consent from the appointed complianceor",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "DPT-3 Filing",
                "price": null,
                "short_description": "File annual DPT-3 return to disclose outstanding loans not classified as deposits under the Companies Act.",
                "description": "DPT-3 is an annual return that companies must file with the MCA to disclose outstanding money received that is not treated as a deposit under the Companies Act. It must be filed by June 30th every year. Failure attracts significant penalties. We prepare and file DPT-3 accurately based on your company's loan and borrowing records.",
                "faqs": [
                    {
                        "question": "What is the due date for DPT-3?",
                        "answer": "June 30th of every financial year for the preceding year's outstanding amounts."
                    },
                    {
                        "question": "What happens if DPT-3 is not filed?",
                        "answer": "Penalties of ₹5,000 for the company plus ₹500/day for continuing default apply."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Outstanding Loan Details",
                        "description": "List of all loans and borrowings outstanding as at March 31st",
                        "is_required": true
                    },
                    {
                        "name": "Complianceor Certificate",
                        "description": "CA certificate confirming amounts are not deposits",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "LLP Form 11 Filing",
                "price": null,
                "short_description": "File the mandatory LLP Annual Return (Form 11) with partner and business details.",
                "description": "Form 11 is the Annual Return of an LLP that must be filed with the MCA by May 30th every year. It captures details of designated partners, total number of partners, and changes during the year. We prepare and file Form 11 accurately, ensuring timely submission to avoid daily late fees.",
                "faqs": [
                    {
                        "question": "What is the due date for LLP Form 11?",
                        "answer": "May 30th every year for the previous financial year's data."
                    },
                    {
                        "question": "What is the late fee for Form 11?",
                        "answer": "₹100 per day per form with no capping, making delay very expensive."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "LLPIN",
                        "description": "LLP Identification Number",
                        "is_required": true
                    },
                    {
                        "name": "Partner Details",
                        "description": "DPIN and contribution of each partner",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "MOA Amendment",
                "price": null,
                "short_description": "Update your company's Memorandum of Association to reflect changes in business objectives.",
                "description": "Amending a company's Memorandum of Association (MOA) requires passing a special resolution by shareholders and filing the amended MOA with the ROC using Form MGT-14 and INC-27. This is necessary when a company changes its name, registered state, or expands its objects clause. We prepare the special resolution and handle all MCA filings.",
                "faqs": [
                    {
                        "question": "What requires an MOA amendment?",
                        "answer": "Changes in business objects, company name, registered state, or authorized capital (via MOA) require an amendment."
                    },
                    {
                        "question": "How long does MOA amendment take?",
                        "answer": "Typically 15-30 days after filing with the ROC."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Special Resolution",
                        "description": "EGM resolution along with notice and explanatory statement",
                        "is_required": true
                    },
                    {
                        "name": "Existing MOA",
                        "description": "Current Memorandum of Association",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "AOA Amendment",
                "price": null,
                "short_description": "Amend your Articles of Association to update governance rules, share structure, or internal policies.",
                "description": "The Articles of Association (AOA) govern the internal management of a company. Amendments require a special resolution passed at an EGM and filing of Form MGT-14 and the altered AOA with the ROC. Common reasons include changes in share transfer restrictions, voting rights, or director appointment procedures. We handle drafting and complete ROC filing.",
                "faqs": [
                    {
                        "question": "When is AOA amendment required?",
                        "answer": "When changing share transfer restrictions, voting rights, director powers, or internal governance policies."
                    },
                    {
                        "question": "Is shareholder approval required for AOA changes?",
                        "answer": "Yes, a special resolution (3/4th majority) at an EGM is required for any AOA amendment."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Special Resolution (EGM Minutes)",
                        "description": "Resolution passed by shareholders",
                        "is_required": true
                    },
                    {
                        "name": "Existing AOA",
                        "description": "Current Articles of Association",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Authorized Capital Increase",
                "price": null,
                "short_description": "Increase your company's authorized share capital to support new funding rounds or share issuances.",
                "description": "To issue new shares beyond the current authorized capital, a company must pass an ordinary resolution at a general meeting and file Form SH-7 with the ROC along with the revised MOA and payment of additional stamp duty. We prepare all required resolutions, update the MOA, and handle the complete ROC filing process.",
                "faqs": [
                    {
                        "question": "What is authorized capital?",
                        "answer": "It is the maximum share capital a company is authorized to issue to shareholders as per its MOA."
                    },
                    {
                        "question": "Does increasing authorized capital require shareholder approval?",
                        "answer": "Yes, an ordinary resolution at a general meeting is required along with an MOA amendment."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Board and Shareholder Resolution",
                        "description": "Resolutions approving the capital increase",
                        "is_required": true
                    },
                    {
                        "name": "Existing MOA",
                        "description": "Current Memorandum of Association",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Share Transfer",
                "price": null,
                "short_description": "Execute a lawful transfer of shares with all required documentation and ROC compliance.",
                "description": "Transferring shares in a private limited company requires executing a share transfer deed (SH-4), stamping it with applicable duty, obtaining board approval, and updating the register of members. There may also be right of first refusal (pre-emption) clauses in the AOA to be followed. We draft the deed, coordinate board approval, and update all statutory registers.",
                "faqs": [
                    {
                        "question": "Can shares be transferred freely in a private limited company?",
                        "answer": "No, the AOA usually restricts free transfer; pre-emption rights must be followed before transferring to a third party."
                    },
                    {
                        "question": "What is Form SH-4?",
                        "answer": "SH-4 is the instrument of transfer for shares; it must be stamped and executed by both transferor and transferee."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Share Transfer Deed (SH-4)",
                        "description": "Executed and stamped transfer instrument",
                        "is_required": true
                    },
                    {
                        "name": "Original Share Certificate",
                        "description": "Certificate of the shares being transferred",
                        "is_required": true
                    },
                    {
                        "name": "Board Resolution",
                        "description": "Approving the transfer",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Winding Up – LLP",
                "price": null,
                "short_description": "Close your LLP formally through a voluntary winding-up process with MCA and ROC filings.",
                "description": "Voluntary winding up of an LLP requires all partners to pass a resolution to wind up, file Form 24 with the MCA after settling all debts, and obtain a dissolution order. We assist with partner resolution drafting, creditor settlement confirmation, and end-to-end MCA filing for a smooth and legally compliant closure.",
                "faqs": [
                    {
                        "question": "What is the process to wind up an LLP?",
                        "answer": "Partner resolution → settle all debts → declaration of solvency → Form 24 filing → dissolution certificate."
                    },
                    {
                        "question": "How long does LLP winding up take?",
                        "answer": "Typically 3-6 months depending on pending compliances and outstanding liabilities."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Partner Resolution",
                        "description": "Unanimous consent of all partners to wind up",
                        "is_required": true
                    },
                    {
                        "name": "Statement of Accounts",
                        "description": "Final accounts confirming all debts are settled",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Winding Up – Company",
                "price": null,
                "short_description": "Formally dissolve your private or public company through the proper MCA winding-up procedure.",
                "description": "Winding up a company can be done voluntarily, through the NCLT (National Company Law Tribunal), or via the Fast Track Exit (FTE/STK-2) route for dormant companies. All pending returns must be filed, dues cleared, and assets distributed before striking off. We guide you through the most efficient and cost-effective route based on your company's status.",
                "faqs": [
                    {
                        "question": "What is the FTE/STK-2 route for company closure?",
                        "answer": "STK-2 is the Strike Off application for dormant or inactive companies that can be dissolved quickly without NCLT involvement."
                    },
                    {
                        "question": "Is all compliance required before winding up?",
                        "answer": "Yes, all pending ITR, ROC returns, and GST filings must be completed before applying for strike-off."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Shareholder Resolution",
                        "description": "Resolution to wind up the company",
                        "is_required": true
                    },
                    {
                        "name": "Indemnity Bond",
                        "description": "Signed by directors confirming no pending liabilities",
                        "is_required": true
                    },
                    {
                        "name": "Affidavit from Directors",
                        "description": "Confirming the company has not commenced business or is inactive",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Commencement Certificate (INC-20A)",
                "price": null,
                "short_description": "File the mandatory INC-20A declaration to legally commence your company's business operations.",
                "description": "Every company incorporated on or after November 2, 2018 must file Form INC-20A (Declaration for Commencement of Business) with the MCA within 180 days of incorporation. Failure to file results in a penalty and prevents the company from borrowing or conducting business. We ensure timely filing with proof of share capital deposited in the company's bank account.",
                "faqs": [
                    {
                        "question": "What is the INC-20A deadline?",
                        "answer": "Within 180 days of the date of incorporation of the company."
                    },
                    {
                        "question": "What is the penalty for not filing INC-20A?",
                        "answer": "The company is penalised ₹50,000 and each officer in default ₹1,000 per day of default."
                    },
                    {
                        "question": "What proof is required for INC-20A?",
                        "answer": "A bank statement proving that the share subscription amount has been deposited in the company's designated bank account."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Bank Statement",
                        "description": "Showing share subscription money received from shareholders",
                        "is_required": true
                    },
                    {
                        "name": "CIN",
                        "description": "Company Identification Number",
                        "is_required": true
                    }
                ]
            }
        ]
    },
    {
        "category": "Project Finance Solutions",
        "slug": "project-finance-solutions",
        "icon": "fa-hand-holding-usd",
        "description": "Fuel your business growth with customized loan solutions designed for every stage of your venture. We connect businesses and individuals with the right lenders for project term loans, working capital facilities, property-backed loans, vehicle financing, education loans, home loans, and personal loans. Our finance advisors assess your credit profile, help prepare a strong credit proposal, and manage the entire application and sanction process — ensuring quick disbursements at competitive interest rates.",
        "services": [
            {
                "name": "Project Term Loan (Factory Building & Plant Machinery)",
                "price": null,
                "short_description": "Long-term project financing for industrial construction and equipment procurement.",
                "description": "Project Term Loans fund industrial projects covering factory building construction and plant & machinery purchase with repayment structured around the project's cash flows. We help businesses identify the right lending institution, prepare project reports, and manage the loan sanction and disbursement process.",
                "faqs": [
                    {
                        "question": "What is the typical tenure for a project term loan?",
                        "answer": "Term loans for projects typically have tenures between 5 to 15 years depending on the nature of the project."
                    },
                    {
                        "question": "What security is required?",
                        "answer": "Primary security is the funded assets (land, building, machinery); collateral may also be required."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Project Report",
                        "description": "Detailed feasibility report with cost and revenue projections",
                        "is_required": true
                    },
                    {
                        "name": "Business Registration",
                        "description": "Company or firm registration documents",
                        "is_required": true
                    },
                    {
                        "name": "Financial Statements",
                        "description": "Last 3 years complianceed financials",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Term Loan Against Property",
                "price": null,
                "short_description": "Unlock the value of your property with a high-value secured term loan for business growth.",
                "description": "Term Loan Against Property (LAP) allows businesses and individuals to mortgage their commercial or residential property to obtain substantial funding for business expansion, working capital, or other financial needs. Loan amounts and interest rates depend on property value and the borrower's creditworthiness. We facilitate lender identification and documentation support.",
                "faqs": [
                    {
                        "question": "What types of properties are eligible for LAP?",
                        "answer": "Both residential and commercial properties, including shops, offices, and industrial units, are eligible security."
                    },
                    {
                        "question": "What is the maximum LTV for LAP?",
                        "answer": "Typically up to 60-75% of the property's market value, depending on the lender's policy."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Property Documents",
                        "description": "Title deed and encumbrance certificate",
                        "is_required": true
                    },
                    {
                        "name": "KYC Documents",
                        "description": "PAN, Aadhaar, and address proof",
                        "is_required": true
                    },
                    {
                        "name": "Financial Statements / Salary Slips",
                        "description": "Income proof of the borrower",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Vehicle / Car Loan",
                "price": null,
                "short_description": "Financing for commercial and personal vehicles for business or individual use.",
                "description": "Vehicle loans cover the purchase of cars, trucks, two-wheelers, and commercial vehicles. Loan amounts can be up to 100% of on-road price for new vehicles, with competitive interest rates. EMI structures are tailored to the borrower's income or business cash flows. We help identify the best loan offer and assist with documentation.",
                "faqs": [
                    {
                        "question": "Can a business avail a vehicle loan?",
                        "answer": "Yes, businesses can avail commercial vehicle or car loans for official use."
                    },
                    {
                        "question": "Is a down payment required?",
                        "answer": "Most lenders require a 10-25% down payment on the vehicle's on-road price."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "KYC Documents",
                        "description": "PAN, Aadhaar, and address proof",
                        "is_required": true
                    },
                    {
                        "name": "Vehicle Quotation",
                        "description": "Proforma invoice from the dealer",
                        "is_required": true
                    },
                    {
                        "name": "Income Proof",
                        "description": "Salary slips or ITR for income verification",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Unsecured Business Loan",
                "price": null,
                "short_description": "Collateral-free business loans based on cash flow and creditworthiness for quick capital access.",
                "description": "Unsecured business loans provide working capital without requiring any property or asset as collateral. They are ideal for businesses with strong cash flows and good credit histories needing quick funds for inventory, payroll, or short-term opportunities. We help you find the right NBFC or bank product with minimal paperwork.",
                "faqs": [
                    {
                        "question": "What is the typical amount for unsecured business loans?",
                        "answer": "Loan amounts typically range from ₹1 lakh to ₹50 lakh depending on business turnover and credit score."
                    },
                    {
                        "question": "How fast is the disbursement?",
                        "answer": "Many lenders disburse unsecured business loans within 3-7 working days of document submission."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "KYC Documents",
                        "description": "PAN, Aadhaar of directors/owners",
                        "is_required": true
                    },
                    {
                        "name": "Bank Statements",
                        "description": "Last 12 months bank statements",
                        "is_required": true
                    },
                    {
                        "name": "ITR and Financial Statements",
                        "description": "Last 2 years income tax returns",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Home Loan",
                "price": null,
                "short_description": "Affordable home financing for purchase, construction, or renovation of residential properties.",
                "description": "Home loans help individuals purchase, construct, or renovate residential properties at competitive interest rates with long repayment tenures of up to 30 years. Tax deductions are available on both principal and interest repayment components. We assist with lender comparison, documentation, and the end-to-end loan sanction process.",
                "faqs": [
                    {
                        "question": "What is the maximum home loan tenure?",
                        "answer": "Most banks and HFCs offer home loans with tenures of up to 30 years."
                    },
                    {
                        "question": "Are tax benefits available on home loans?",
                        "answer": "Yes, Section 80C (principal) and Section 24(b) (interest) provide deductions of up to ₹1.5L and ₹2L respectively."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "KYC Documents",
                        "description": "PAN, Aadhaar, and address proof",
                        "is_required": true
                    },
                    {
                        "name": "Property Documents",
                        "description": "Sale agreement, title deed, or builder allotment letter",
                        "is_required": true
                    },
                    {
                        "name": "Income Proof",
                        "description": "Salary slips, Form 16, or ITR",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Working Capital Loan",
                "price": null,
                "short_description": "Short-term credit to fund daily operations including raw material, payroll, and inventory needs.",
                "description": "Working Capital Loans are short-term credit facilities designed to meet a business's day-to-day operational expenses such as raw material procurement, payroll, and trade receivables. Products include overdraft, cash credit, and short-term loans. We assist businesses in identifying suitable working capital products and preparing the credit proposal.",
                "faqs": [
                    {
                        "question": "What is the difference between CC and OD?",
                        "answer": "Cash Credit (CC) is secured against stock, while Overdraft (OD) is against property or fixed deposits."
                    },
                    {
                        "question": "Is working capital loan renewable?",
                        "answer": "Yes, most working capital facilities are renewed annually subject to satisfactory account conduct and financials."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Business Registration",
                        "description": "Company/firm registration",
                        "is_required": true
                    },
                    {
                        "name": "Bank Statements",
                        "description": "Last 12 months",
                        "is_required": true
                    },
                    {
                        "name": "Stock and Debtor Statement",
                        "description": "Current inventory and receivables details",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Education Loan",
                "price": null,
                "short_description": "Fund higher education in India or abroad with a structured education loan from leading banks.",
                "description": "Education loans cover tuition fees, living expenses, books, and travel for higher education in India or abroad. Most banks offer moratorium periods during the course plus 6-12 months. Interest paid during the moratorium can be claimed as a deduction under Section 80E. We assist with lender selection, documentation, and application submission.",
                "faqs": [
                    {
                        "question": "What courses are eligible for education loans?",
                        "answer": "Graduate, post-graduate, doctoral, and professional courses in India and abroad from recognized institutions are eligible."
                    },
                    {
                        "question": "Is collateral required for education loans?",
                        "answer": "Loans up to ₹7.5 lakh typically require no collateral; higher amounts may require property as security."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "Admission Confirmation Letter",
                        "description": "Offer letter from the educational institution",
                        "is_required": true
                    },
                    {
                        "name": "KYC Documents",
                        "description": "PAN and Aadhaar of student and co-borrower",
                        "is_required": true
                    },
                    {
                        "name": "Fee Structure",
                        "description": "Detailed fee schedule from the institution",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Commercial Property Loan",
                "price": null,
                "short_description": "Finance the purchase of office spaces, warehouses, or commercial units for your business.",
                "description": "Commercial Property Loans enable businesses and investors to purchase shops, offices, showrooms, warehouses, or factory premises. Loan amounts can be up to 70-75% of the property value with tenures ranging up to 15 years. We connect you with the most suitable lender and assist with property due diligence and loan documentation.",
                "faqs": [
                    {
                        "question": "Can individuals apply for commercial property loans?",
                        "answer": "Yes, self-employed individuals, business owners, and companies can apply for commercial property loans."
                    },
                    {
                        "question": "Is the interest rate higher than home loans?",
                        "answer": "Yes, commercial property loans typically carry marginally higher interest rates than residential home loans."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "KYC Documents",
                        "description": "PAN, Aadhaar, and address proof",
                        "is_required": true
                    },
                    {
                        "name": "Property Documents",
                        "description": "Title deed, sale agreement, and encumbrance certificate",
                        "is_required": true
                    },
                    {
                        "name": "Business/Income Proof",
                        "description": "ITR and financial statements",
                        "is_required": true
                    }
                ]
            },
            {
                "name": "Personal Loan",
                "price": null,
                "short_description": "Unsecured multi-purpose personal loans for travel, medical emergencies, weddings, or any need.",
                "description": "Personal loans are collateral-free loans for individuals to meet any personal financial requirement — whether medical emergencies, travel, weddings, home renovation, or debt consolidation. Amounts typically range from ₹50,000 to ₹40 lakh with tenures up to 5 years. We help you compare offers and get the best rate based on your credit profile.",
                "faqs": [
                    {
                        "question": "What is the credit score needed for a personal loan?",
                        "answer": "Most lenders prefer a credit score of 700+ (CIBIL) for personal loan approval at competitive rates."
                    },
                    {
                        "question": "How fast can a personal loan be disbursed?",
                        "answer": "Many banks and NBFCs disburse personal loans within 24-72 hours of document verification and approval."
                    }
                ],
                "required_documents_list": [
                    {
                        "name": "PAN Card",
                        "description": "Mandatory identity and income tax proof",
                        "is_required": true
                    },
                    {
                        "name": "Aadhaar Card",
                        "description": "Address and identity proof",
                        "is_required": true
                    },
                    {
                        "name": "Salary Slips / ITR",
                        "description": "Income proof for the last 3-6 months",
                        "is_required": true
                    },
                    {
                        "name": "Bank Statements",
                        "description": "Last 3-6 months bank statements",
                        "is_required": true
                    }
                ]
            }
        ]
    }
];

export default servicesSeedData;
