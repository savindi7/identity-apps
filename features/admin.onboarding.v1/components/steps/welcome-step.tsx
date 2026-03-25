/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Theme, styled } from "@mui/material/styles";
import Box from "@oxygen-ui/react/Box";
import { AppState } from "@wso2is/admin.core.v1/store";
import { IdentifiableComponentInterface } from "@wso2is/core/models";
import React, { FunctionComponent, ReactElement, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { ReactComponent as Preview } from "../../assets/icons/preview.svg";
import { ReactComponent as Rocket } from "../../assets/icons/rocket.svg";
import { OnboardingComponentIds } from "../../constants";
import { OnboardingChoice } from "../../models";
import Hint from "../shared/hint";
import {
    CardsRow,
    LeftColumn,
    RightColumn,
    TwoColumnLayout
} from "../shared/onboarding-styles";
import SelectableCard from "../shared/selectable-card";
import StepHeader from "../shared/step-header";
import StepIndicator, { StepConfigInterface } from "../shared/step-indicator";

/**
 * Gradient-highlighted text span using the primary color.
 */
const AccentText: typeof Box = styled(Box)(({ theme }: { theme: Theme }) => ({
    color: theme.palette.primary.main,
    display: "inline",
    fontWeight: 600
}));

/**
 * Steps for the "Add login to app" flow.
 */
const ADD_LOGIN_STEPS: StepConfigInterface[] = [
    { key: "type", label: "Select your app type" },
    { key: "configure", label: "Configure your login options" },
    { key: "style", label: "Design your login screen" },
    { key: "guide", label: "Integrate login to your app" }
];

/**
 * Steps for the "Preview experience" flow.
 */
const PREVIEW_STEPS: StepConfigInterface[] = [
    { key: "configure", label: "Configure your login options" },
    { key: "style", label: "Design your login screen" },
    { key: "preview", label: "Preview the experience" }
];

/**
 * Props interface for WelcomeStep component.
 */
interface WelcomeStepPropsInterface extends IdentifiableComponentInterface {
    /**
     * Display name of the logged-in user for the greeting.
     */
    greeting?: string;
    /**
     * Whether the user is returning via the Setup Guide FAB (not a first-time visit).
     */
    isReturningUser?: boolean;
    /**
     * Currently selected choice.
     */
    selectedChoice?: OnboardingChoice;
    /**
     * Callback when a choice is selected.
     */
    onChoiceSelect: (choice: OnboardingChoice) => void;
}

/**
 * Welcome step component for onboarding.
 * First step where user chooses between setting up their app or previewing.
 */
const WelcomeStep: FunctionComponent<WelcomeStepPropsInterface> = (props: WelcomeStepPropsInterface): ReactElement => {
    const {
        greeting,
        isReturningUser = false,
        onChoiceSelect,
        selectedChoice,
        ["data-componentid"]: componentId = OnboardingComponentIds.WELCOME_STEP
    } = props;

    const productName: string = useSelector((state: AppState) =>
        state.config?.ui?.productName || ""
    );

    // Memoize the handler to prevent unnecessary re-renders
    const handleChoiceSelect: (choice: OnboardingChoice) => void = useCallback(
        (choice: OnboardingChoice) => {
            onChoiceSelect(choice);
        },
        [ onChoiceSelect ]
    );

    // Determine which steps to show based on selection
    const currentSteps: StepConfigInterface[] = useMemo(() => {
        if (selectedChoice === OnboardingChoice.TOUR) {
            return PREVIEW_STEPS;
        }

        return ADD_LOGIN_STEPS;
    }, [ selectedChoice ]);

    return (
        <TwoColumnLayout data-componentid={ componentId }>
            <LeftColumn sx={ { maxWidth: 600 } }>
                <Box sx={ { mb: 1 } }>
                    <StepHeader
                        data-componentid={ `${componentId}-header` }
                        subtitle={ isReturningUser
                            ? "Set up a new app or preview the login experience"
                            : "What would you like to do first?"
                        }
                        title={ isReturningUser
                            ? `Hi${greeting ? ` ${greeting}` : ""} 👋, What would you like to do?`
                            : `Hi${greeting ? ` ${greeting}` : ""} 👋`
                        }
                    />
                </Box>
                <CardsRow>
                    <Box
                        sx={ {
                            "@keyframes fadeSlideIn": {
                                from: { opacity: 0, transform: "translateY(12px)" },
                                to: { opacity: 1, transform: "translateY(0)" }
                            },
                            animation: "fadeSlideIn 400ms ease forwards"
                        } }
                    >
                        <SelectableCard
                            data-componentid={ `${componentId}-add-login-option` }
                            description="Continue guided set up to integrate login into your existing app"
                            icon={ <Rocket fill="#ff7300" /> }
                            isSelected={ selectedChoice === OnboardingChoice.SETUP }
                            onClick={ () => handleChoiceSelect(OnboardingChoice.SETUP) }
                            title="Add login to your app"
                            variant="large"
                        />
                    </Box>
                    <Box
                        sx={ {
                            animation: "fadeSlideIn 400ms ease 100ms forwards",
                            opacity: 0
                        } }
                    >
                        <SelectableCard
                            data-componentid={ `${componentId}-preview-option` }
                            description={
                                "Not ready to code? Launch a live playground " +
                                "to see the user journey"
                            }
                            icon={ <Preview style={ { color: "#ff7300" } } /> }
                            isSelected={ selectedChoice === OnboardingChoice.TOUR }
                            onClick={ () => handleChoiceSelect(OnboardingChoice.TOUR) }
                            title="Preview the login experience"
                            variant="large"
                        />
                    </Box>
                </CardsRow>

                <Hint message="You can switch between these options later." />
            </LeftColumn>

            <RightColumn
                sx={ (theme: Theme) => ({
                    backgroundColor: theme.palette.grey[50],
                    margin: theme.spacing(-6, -8, 0, 0),
                    minWidth: 300,
                    padding: theme.spacing(6, 4, 4, 4)
                }) }
            >
                { selectedChoice && (
                    <StepIndicator
                        data-componentid={ `${componentId}-step-indicator` }
                        steps={ currentSteps }
                        variant="default"
                    />
                ) }
            </RightColumn>
        </TwoColumnLayout>
    );
};

export default WelcomeStep;
