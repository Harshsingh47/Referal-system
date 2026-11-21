import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    fullName: {
      type: String,
      required: [true, 'Full Name is required'],
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: [true, 'Email Address is required'],
      unique: true,
      trim: true,
      lowercase: true
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile Number is required'],
      unique: true,
      trim: true
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    // Banking Details
    accountHolderName: {
      type: String,
      required: [true, 'Account Holder Name is required'],
      trim: true,
      maxlength: 100
    },
    bankName: {
      type: String,
      required: [true, 'Bank Name is required'],
      trim: true,
      maxlength: 100
    },
    encryptedAccountNumber: {
      type: String,
      required: [true, 'Encrypted Account Number is required']
    },
    accountNumberLast4: {
      type: String,
      required: true
    },
    ifscCode: {
      type: String,
      required: [true, 'IFSC Code is required'],
      trim: true,
      uppercase: true
    },
    branchName: {
      type: String,
      trim: true,
      default: ''
    },
    // Referral Details & Sponsorship
    referralCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    // The referral code of the user who referred this person
    referredBy: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
      index: true
    },
    // Direct sponsor information captured at registration for MLM tracking
    referrerName: {
      type: String,
      trim: true,
      default: null
    },
    referrerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },
    referrerMobile: {
      type: String,
      trim: true,
      default: null
    },
    referrerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      default: null
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    registrationStatus: {
      type: String,
      enum: ['active', 'pending', 'verified', 'suspended'],
      default: 'active'
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        // Never expose sensitive banking details or internal mongoose fields in JSON
        delete ret.encryptedAccountNumber;
        delete ret.__v;
        return ret;
      }
    }
  }
);

const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;
