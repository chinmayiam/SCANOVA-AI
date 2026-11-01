SCANOV AI -- Adaptive AI-Driven Medical Scan Analysis

Tagline: Smarter Medical Imaging. Faster Insights.
Domain: MedTech -- Artificial Intelligence in Healthcare
Team: OXVEX

About the Project

SCANOV AI is a medical scan analysis support prototype designed to
assist doctors in reviewing medical images, with an initial focus on
identifying possible kidney stones.

The system provides a workflow for managing patient records, uploading
or capturing scans, checking image quality, viewing scan images, and
generating preliminary PDF reports. Its aim is to support faster medical
assessment while keeping the final decision with a qualified medical
professional.

Important: SCANOV AI is a decision-support prototype, not a
replacement for a doctor. AI-generated findings must be reviewed and
confirmed by a qualified medical professional.

Problem Statement

Delays in medical scan analysis and manual examination can make it
difficult for doctors to quickly assess possible kidney stones,
including their location, size, and count.

Proposed Solution

SCANOV AI aims to support doctors through an organized scan-analysis
workflow:

Patient Management: Create and maintain patient records.

Scan Upload and Capture: Upload a scan or capture one using a
camera.

Image Quality Check: Identify images that are blurry, unclear,
or unsuitable for analysis.

Scan Analysis: Support AI-based analysis when a suitable model
is integrated.

Visual Scan Preview: Display the uploaded scan and valid
model-generated annotations.

Preliminary PDF Reports: Generate a report that can be reviewed
and downloaded.

Key Features

Patient record creation and management.

Scan upload and camera capture.

CT Scan, Ultrasound, and MRI modality selection in the interface.

Image quality checking and retry option for unclear images.

Scan preview for the uploaded image.

Preliminary report generation and PDF printing/downloading.

Light and dark appearance settings, language preferences, and
font-size options.

How It Works

The doctor adds a patient record or selects an existing patient.

The doctor opens Scan Analysis.

The doctor selects the scan modality.

The scan is uploaded or captured.

The system checks whether the image is suitable for analysis.

If the image is unclear, the doctor is asked to upload or capture
another image.

The scan-analysis workflow processes the image when the required AI
model is available.

A preliminary report is generated for the doctor's review.

Current Development Status

The current prototype includes the patient-management and scan-analysis
workflow, scan upload/preview interface, and preliminary
report-generation interface.

AI model integration is still pending. Until a suitable medical
imaging model is integrated and validated, the application must not be
treated as performing real kidney-stone detection. It should clearly
show when analysis is unavailable or inconclusive rather than generating
simulated findings.

Reliable detection, visual annotations, and stone size estimation
require an appropriate trained and validated model. Size estimation also
requires reliable image calibration information, such as DICOM pixel
spacing.

Technology Stack

The project technology stack may include:

Frontend: React.js, TypeScript, Tailwind CSS

Backend: Python, FastAPI

Image Processing: OpenCV

AI / Machine Learning: PyTorch or TensorFlow with a trained
medical-imaging model

Database: MySQL or PostgreSQL

Reporting: PDF-generation tools

Only list a technology as implemented in your final project submission
if it is actually used in the current codebase.

Safety and Limitations

SCANOV AI is intended to assist medical professionals, not diagnose
patients independently.

The output is preliminary and requires professional review.

AI detection should only be enabled after suitable model integration
and validation.

Ultrasound and MRI analysis require modality-appropriate models and
validation; support in the interface alone does not mean reliable
analysis is available.

Stone size should only be reported when image calibration supports a
reliable measurement.

Patient information and medical images should be handled securely
and accessed only by authorized users.

Future Enhancements

Integrate and validate a kidney-stone detection model.

Improve detection and localization of suspected stones.

Add reliable stone count and size estimation where image data
permits.

Improve support for different medical imaging modalities.

Strengthen data security, testing, and clinical validation.

Disclaimer

SCANOV AI is an academic/prototype project for medical scan analysis
support. It is not a certified medical device and must not be used as
the sole basis for diagnosis or treatment decisions. All findings
require review by a qualified healthcare professional.
