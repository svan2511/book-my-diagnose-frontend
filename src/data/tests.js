export const testDirectory = {
    CBC001: {
      title: "Complete Blood Count (CBC)",
      code: "CBC001",
      price: "₹399",
      scope: "Evaluates cellular components of circulating blood: red cells, leukocytes, hemoglobin concentration, and thrombocytes to identify infections, anemia, and leukemia.",
      instructions: [
        "No overnight fasting is required.",
        "Drink 1 glass of water 15 minutes before phlebotomy to ensure prominent venipuncture.",
        "Inform phlebotomist if you take blood thinners (Aspirin, Clopidogrel)."
      ],
      table: [
        { marker: "Hemoglobin", method: "SLS Method", range: "13.0 - 17.0 g/dL" },
        { marker: "Total WBC Count", method: "Flow Cytometry", range: "4,000 - 11,000 /µL" },
        { marker: "Platelet Count", method: "Direct Impedance", range: "150,000 - 450,000 /µL" },
        { marker: "Packed Cell Volume (PCV)", method: "Automated Hematology", range: "40.0 - 50.0 %" }
      ]
    },
    LFT002: {
      title: "Liver Function Test (LFT)",
      code: "LFT002",
      price: "₹699",
      scope: "Quantifies vital liver enzymes and biliary clearance markers (SGPT/ALT, SGOT/AST, Bilirubin fractions, Alkaline Phosphatase) to assess liver damage and hepatitis.",
      instructions: [
        "Strict 10-12 hours overnight fasting mandatory.",
        "Plain water is permissible during fasting hours.",
        "Avoid alcohol consumption for 48 hours prior to sample collection."
      ],
      table: [
        { marker: "SGPT / ALT", method: "IFCC without Pyridoxal", range: "< 45 U/L" },
        { marker: "SGOT / AST", method: "IFCC without Pyridoxal", range: "< 40 U/L" },
        { marker: "Bilirubin Total", method: "Diazo Method", range: "0.2 - 1.2 mg/dL" },
        { marker: "Serum Albumin", method: "BCG Dye Binding", range: "3.5 - 5.2 g/dL" }
      ]
    },
    KFT003: {
      title: "Kidney Function Test (KFT)",
      code: "KFT003",
      price: "₹649",
      scope: "Assesses renal excretion and glomerular clearance of protein byproducts including Serum Creatinine, Blood Urea Nitrogen, and Uric Acid.",
      instructions: [
        "Fasting is not strictly required unless combined with Glucose screening.",
        "Avoid intense high-protein workouts 24 hours prior.",
        "Stay comfortably hydrated before blood draw."
      ],
      table: [
        { marker: "Serum Creatinine", method: "Modified Jaffe Reaction", range: "0.7 - 1.3 mg/dL" },
        { marker: "Blood Urea Nitrogen (BUN)", method: "GLDH Enzymatic", range: "6 - 20 mg/dL" },
        { marker: "Uric Acid", method: "Uricase Method", range: "3.5 - 7.2 mg/dL" }
      ]
    },
    DIA102: {
      title: "HbA1c Glycated Hemoglobin",
      code: "DIA102",
      price: "₹499",
      scope: "Measures glycated hemoglobin molecules inside erythrocytes, reflecting mean average blood glucose values over the past 90 days. Does not fluctuate based on recent meals.",
      instructions: [
        "No fasting required. Test can be done at any hour.",
        "Take all morning oral diabetic tablets as per daily schedule.",
        "Ideal for tracking prediabetes and type 2 diabetes therapeutic efficacy."
      ],
      table: [
        { marker: "HbA1c %", method: "HPLC (Gold Standard)", range: "Normal: < 5.7% | Prediabetic: 5.7-6.4%" },
        { marker: "Estimated Avg Glucose (eAG)", method: "Calculated Formula", range: "90 - 120 mg/dL" }
      ]
    },
    THY301: {
      title: "Complete Thyroid Care (T3, T4, TSH)",
      code: "THY301",
      price: "₹549",
      scope: "Triple panel analyzing Total Triiodothyronine (T3), Total Thyroxine (T4), and Thyroid Stimulating Hormone (TSH) to diagnose hypothyroid or hyperthyroid states.",
      instructions: [
        "Morning draw recommended between 07:00 AM – 10:00 AM.",
        "Do not consume thyroid medication (e.g. Thyronorm) before blood draw on the morning of testing; take immediately after.",
        "Light fasting preferred."
      ],
      table: [
        { marker: "TSH (Ultrasensitive)", method: "Chemiluminescence (CLIA)", range: "0.45 - 4.50 µIU/mL" },
        { marker: "Total T3", method: "CLIA", range: "0.8 - 2.0 ng/mL" },
        { marker: "Total T4", method: "CLIA", range: "5.1 - 14.1 µg/dL" }
      ]
    },
    LIP204: {
      title: "Lipid Profile Heart Risk",
      code: "LIP204",
      price: "₹799",
      scope: "Evaluates circulating dyslipidemia markers: Total Cholesterol, Triglycerides, HDL ('Good'), LDL ('Bad'), and VLDL ratios to estimate atherosclerotic cardiovascular risk.",
      instructions: [
        "Mandatory 12-hour strict overnight fasting.",
        "Water is permitted during the fasting period.",
        "Avoid heavy fatty dinners the evening before testing."
      ],
      table: [
        { marker: "Total Cholesterol", method: "CHOD-PAP", range: "< 200 mg/dL" },
        { marker: "HDL Cholesterol", method: "Direct Enzymatic", range: "> 40 mg/dL (Desirable > 50)" },
        { marker: "Triglycerides", method: "GPO-PAP", range: "< 150 mg/dL" },
        { marker: "LDL Cholesterol", method: "Calculated (Friedewald)", range: "< 100 mg/dL" }
      ]
    },
    VIT405: {
      title: "Vitamin D (25-OH) & Vitamin B12 Duo",
      code: "VIT405",
      price: "₹1,199",
      scope: "Screens for pervasive deficiency syndromes impacting bone mineralization, chronic neuromuscular fatigue, pernicious anemia, and peripheral neuropathies.",
      instructions: [
        "No fasting required.",
        "Discontinue high-dose Biotin or multivitamin megadoses 48 hours prior if approved by doctor.",
        "Sample is shielded from light during transportation."
      ],
      table: [
        { marker: "25-OH Vitamin D", method: "ECLIA Technology", range: "Sufficiency: 30 - 100 ng/mL" },
        { marker: "Vitamin B12", method: "CLIA", range: "211 - 911 pg/mL" }
      ]
    },
    FBP501: {
      title: "Executive Master Health Checkup",
      code: "FBP501",
      price: "₹1,899",
      scope: "Comprehensive 84-parameter wellness audit comprising Complete Blood Count, Liver Function, Kidney Profile, Full Lipid Panel, HbA1c, Thyroid Stimulating Hormone, and Urine Routine.",
      instructions: [
        "Strict 10-12 hours fasting required.",
        "Phlebotomist will provide a sterile urine container during doorstep arrival for a clean-catch midstream sample.",
        "Complimentary certified phlebotomist home visit included."
      ],
      table: [
        { marker: "Comprehensive Hematology", method: "8-part differential", range: "24 Parameters Included" },
        { marker: "Hepatorenal Enzymes", method: "Enzymatic Spectrometry", range: "19 Parameters Included" },
        { marker: "Metabolic & Thyroid", method: "CLIA & HPLC", range: "HbA1c + eAG + TSH" },
        { marker: "Urine Routine & Microscopic", method: "Automated Dipstick", range: "18 Parameters" }
      ]
    }
  };

export const testsList = [
  { code: 'CBC001', cat: 'blood', price: 399, tat: 12, title: 'Complete Blood Count (CBC)', desc: '24-parameter hematology with hemoglobin, WBC differential & platelets.', params: '24 Parameters', tatLabel: '12 Hours', fasting: false },
  { code: 'LFT002', cat: 'organ', price: 699, tat: 24, title: 'Liver Function Test (LFT)', desc: 'SGPT, SGOT, bilirubin, albumin & 9 liver markers.', params: '11 Parameters', tatLabel: '24 Hours', fasting: true },
  { code: 'KFT003', cat: 'organ', price: 649, tat: 24, title: 'Kidney Function Test (KFT)', desc: 'Creatinine, BUN, uric acid & electrolytes renal panel.', params: '9 Parameters', tatLabel: '24 Hours', fasting: false },
  { code: 'DIA102', cat: 'diabetes', price: 499, tat: 12, title: 'HbA1c Glycated Hemoglobin', desc: '90-day average glucose, HPLC gold-standard diabetes tracker.', params: '2 Parameters', tatLabel: '12 Hours', fasting: false },
  { code: 'THY301', cat: 'thyroid', price: 549, tat: 24, title: 'Complete Thyroid Care (T3, T4, TSH)', desc: 'Triple CLIA panel for hypo / hyper thyroid diagnosis.', params: '3 Parameters', tatLabel: '24 Hours', fasting: false },
  { code: 'LIP204', cat: 'cardiac', price: 799, tat: 14, title: 'Lipid Profile Heart Risk', desc: 'Cholesterol, HDL, LDL, triglycerides & cardiac risk ratios.', params: '8 Parameters', tatLabel: '14 Hours', fasting: true },
  { code: 'VIT405', cat: 'vitamin', price: 1199, tat: 48, title: 'Vitamin D (25-OH) & B12 Duo', desc: 'Bone, fatigue & neuropathy deficiency screening duo.', params: '2 Parameters', tatLabel: '48 Hours', fasting: false },
  { code: 'FBP501', cat: 'full-body', price: 1899, tat: 24, title: 'Executive Master Health Checkup', desc: '84-parameter full-body audit with CBC, LFT, KFT, lipid & urine.', params: '84 Parameters', tatLabel: '24 Hours', fasting: true },
];
