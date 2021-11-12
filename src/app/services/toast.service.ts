import { Injectable } from '@angular/core';
import {
    ToastNotificationInitializer,
    ConfirmBoxInitializer,
    DialogLayoutDisplay,
    ToastUserViewTypeEnum,
    ToastProgressBarEnum,
    ToastPositionEnum,
    IButton,
    ButtonLayoutDisplay,
} from '@costlydeveloper/ngx-awesome-popup';

@Injectable({ providedIn: 'root' })
export class ToastService {

    toastNotification(title: string, message: string, dialogLayout?: DialogLayoutDisplay, toastrPos?: ToastPositionEnum) {
        const newToastNotification = new ToastNotificationInitializer();

        newToastNotification.setTitle(title || 'Message');
        newToastNotification.setMessage(message || '');

        newToastNotification.setConfig({
            AutoCloseDelay: 5000,
            TextPosition: 'right',
            LayoutType: dialogLayout || DialogLayoutDisplay.SUCCESS, // SUCCESS | INFO | NONE | DANGER | WARNING
            ProgressBar: ToastProgressBarEnum.INCREASE, // INCREASE | DECREASE | NONE
            ToastUserViewType: ToastUserViewTypeEnum.SIMPLE, // STANDARD | SIMPLE
            // TOP_LEFT | TOP_CENTER | TOP_RIGHT | TOP_FULL_WIDTH | BOTTOM_LEFT | BOTTOM_CENTER | BOTTOM_RIGHT | BOTTOM_FULL_WIDTH
            ToastPosition: toastrPos || ToastPositionEnum.TOP_RIGHT,
        });
        return newToastNotification.openToastNotification$();
    }

    openConfirmPopup(title: string, message: string, dialogLayout?: DialogLayoutDisplay) {
        const newConfirmBox = new ConfirmBoxInitializer();

        newConfirmBox.setTitle(title || 'Confirm');
        newConfirmBox.setMessage(message || '');
        const btns: IButton[] = [
            {
                Label: 'YES',
                LayoutType: ButtonLayoutDisplay.PRIMARY,
                ID: 'yes'
            },
            {
                Label: 'NO',
                LayoutType: ButtonLayoutDisplay.SECONDARY,
                ID: 'no'
            }
        ]
        newConfirmBox.setButtons(btns);

        newConfirmBox.setConfig({
            LayoutType: dialogLayout || DialogLayoutDisplay.WARNING, // SUCCESS | INFO | NONE | DANGER | WARNING
        });

        return newConfirmBox.openConfirmBox$();
    }
}