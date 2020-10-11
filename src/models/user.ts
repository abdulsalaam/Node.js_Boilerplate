import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';
import { NextFunction } from 'express';
import { IUser } from '../utils/types';

const Schema = mongoose.Schema;
const SALT_ROUNDS: number = 6;

const userSchema = new Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true,
            validate(value: string): any {
                if (!validator.isEmail(value)) {
                    throw new Error('Email is invalid');
                }
            },
        },
        verifyToken: String,
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        password: {
            type: String,
            require: true,
            minlength: 3,
            trim: true,
            validate(value: string): any {
                if (value.toLowerCase().includes('password')) {
                    throw new Error('Password cannot contain "password"');
                }
            },
        },
        admin: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre<IUser>('save', async function (next) {
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
    }

    next();
});

userSchema.methods.comparePassword = function (
    tryPassword: string,
    callback: NextFunction
) {
    bcrypt.compare(tryPassword, this.password, callback);
};

userSchema.set('toJSON', {
    transform: function (_, ret) {
        delete ret.password;
        delete ret.createdAt;
        delete ret.updatedAt;
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model<IUser>('User', userSchema);