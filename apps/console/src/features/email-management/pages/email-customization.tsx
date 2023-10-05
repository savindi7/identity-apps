/**
 * Copyright (c) 2023, WSO2 LLC. (https://www.wso2.com).
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

import { IdentityAppsApiException } from "@wso2is/core/exceptions";
import { AlertInterface, AlertLevels, IdentifiableComponentInterface } from "@wso2is/core/models";
import { addAlert } from "@wso2is/core/store";
import {
    ConfirmationModal,
    DocumentationLink,
    PageLayout,
    ResourceTab,
    SecondaryButton,
    useDocumentation
} from "@wso2is/react-components";
import { AxiosResponse } from "axios";
import React, { FunctionComponent, ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Dispatch } from "redux";
import { TabProps } from "semantic-ui-react";
import { AppConstants, AppState, FeatureConfigInterface, I18nConstants } from "../../core";
import { history } from "../../core/helpers";
import {
    createNewEmailTemplate,
    deleteEmailTemplate,
    updateEmailTemplate,
    useEmailTemplate,
    useEmailTemplatesList
} from "../api";
import { EmailCustomizationForm, EmailTemplatePreview } from "../components";
import EmailCustomizationFooter from "../components/email-customization-footer";
import EmailCustomizationHeader from "../components/email-customization-header";
import { EmailTemplate, EmailTemplateType } from "../models";

type EmailCustomizationPageInterface = IdentifiableComponentInterface;

/**
 * Email customization page.
 *
 * @param props - Props injected to the component.
 *
 * @returns Main Page for Email Customization.
 */
const EmailCustomizationPage: FunctionComponent<EmailCustomizationPageInterface> = (
    props: EmailCustomizationPageInterface
): ReactElement => {
    const { ["data-componentid"]: componentId } = props;

    const [ availableEmailTemplatesList, setAvailableEmailTemplatesList ] = useState<EmailTemplateType[]>([]);
    const [ selectedEmailTemplateId, setSelectedEmailTemplateId ] = useState<string>();
    const [ selectedEmailTemplateDescription, setSelectedEmailTemplateDescription ] = useState<string>();
    const [ selectedLocale, setSelectedLocale ] = useState(I18nConstants.DEFAULT_FALLBACK_LANGUAGE);
    const [ selectedEmailTemplate, setSelectedEmailTemplate ] = useState<EmailTemplate>();
    const [ currentEmailTemplate, setCurrentEmailTemplate ] = useState<EmailTemplate>();
    const [ showReplicatePreviousTemplateModal, setShowReplicatePreviousTemplateModal ] = useState(false);
    const [ isTemplateNotAvailable, setIsTemplateNotAvailable ] = useState(false);

    const featureConfig : FeatureConfigInterface = useSelector((state: AppState) => state.config.ui.features);

    const emailTemplates: Record<string, string>[] = useSelector(
        (state: AppState) => state.config.deployment.extensions.emailTemplates) as Record<string, string>[];

    const dispatch: Dispatch = useDispatch();
    const { t } = useTranslation();
    const { getLink } = useDocumentation();

    const {
        data: emailTemplatesList,
        isLoading: isEmailTemplatesListLoading,
        error: emailTemplatesListError
    } = useEmailTemplatesList();

    const {
        data: emailTemplate,
        isLoading: isEmailTemplateLoading,
        error: emailTemplateError,
        mutate: emailTemplateMutate
    } = useEmailTemplate(selectedEmailTemplateId, selectedLocale);

    useEffect(() => {
        // As of now, we need to show only the used email templates, and we don't have a good displayName and
        // description coming from the backend for the email template types. So as we agreed to filter only the used
        // templates, and we will use the displayName and description from the email template types config defined in
        // the deployment.toml file. The below code will first filter all the email templates and map the email template
        // types with the config's displayName and description.
        const availableEmailTemplates: EmailTemplateType[] = emailTemplatesList?.filter(
            (template: EmailTemplateType) => {
                return emailTemplates?.find((emailTemplate: Record<string, string>) =>
                    emailTemplate.id === template.id);
            })
            .map((template: EmailTemplateType) => {
                const mappedTemplate: Record<string, string> = emailTemplates
                    ?.find((emailTemplate: Record<string, string>) => emailTemplate.id === template.id);

                return {
                    ...template,
                    description: mappedTemplate?.description || `${ template.displayName } Template`,
                    displayName: mappedTemplate?.displayName || template.displayName
                };
            });

        setAvailableEmailTemplatesList(availableEmailTemplates);

        if (!selectedEmailTemplateId) {
            setSelectedEmailTemplateId(availableEmailTemplates?.[0]?.id);
            setSelectedEmailTemplateDescription(availableEmailTemplates?.[0]?.description);
        }
    }, [ emailTemplatesList ]);

    useEffect(() => {
        setSelectedEmailTemplate({ ...emailTemplate });
        setIsTemplateNotAvailable(false);

        if (emailTemplate && Object.keys(emailTemplate).length > 0) {
            setCurrentEmailTemplate({ ...emailTemplate });
        }
    }, [ emailTemplate ]);

    useEffect(() => {
        if (!emailTemplatesListError) {
            return;
        }

        if (emailTemplatesListError.response.data.description) {
            dispatch(addAlert({
                description: emailTemplatesListError.response?.data?.description,
                level: AlertLevels.ERROR,
                message: emailTemplatesListError.response.data.message ??
                    t("extensions:develop.emailTemplates.notifications.getEmailTemplateList.error.message")
            }));

            return;
        }

        dispatch(addAlert({
            description: t("extensions:develop.emailTemplates.notifications.getEmailTemplateList.error.description"),
            level: AlertLevels.ERROR,
            message: t("extensions:develop.emailTemplates.notifications.getEmailTemplateList.error.message")
        }));
    }, [ emailTemplatesListError ]);

    useEffect(() => {
        if (!emailTemplateError || !selectedEmailTemplateId) {
            return;
        }

        // Show the replicate previous template modal and set the "isTemplateNotAvailable" flag to identify whether the
        // current template is a new template or not
        if (emailTemplateError.response.status === 404) {
            setIsTemplateNotAvailable(true);
            setShowReplicatePreviousTemplateModal(true);

            return;
        }

        if (emailTemplateError.response.data.description) {
            dispatch(addAlert({
                description: emailTemplateError.response?.data?.description,
                level: AlertLevels.ERROR,
                message: emailTemplateError.response.data.message ??
                    t("extensions:develop.emailTemplates.notifications.getEmailTemplate.error.message")
            }));

            return;
        }

        dispatch(addAlert({
            description: t("extensions:develop.emailTemplates.notifications.getEmailTemplate.error.description"),
            level: AlertLevels.ERROR,
            message: t("extensions:develop.emailTemplates.notifications.getEmailTemplate.error.message")
        }));
    }, [ emailTemplateError ]);

    // This is used to check whether the URL contains a template ID, and if so, set it as the selected template.
    useEffect(() => {
        const hash: string = window.location.hash;

        if (hash.startsWith("#templateId=")) {
            const templateId: string = hash.split("=")[1];

            setSelectedEmailTemplateId(templateId);
            setSelectedEmailTemplateDescription(availableEmailTemplatesList?.find(
                (template: EmailTemplateType) => template.id === templateId)?.description);
        }
    }, [ window.location.hash ]);

    const handleTemplateIdChange = (templateId: string) => {
        setIsTemplateNotAvailable(false);
        setCurrentEmailTemplate(undefined);
        setSelectedLocale(I18nConstants.DEFAULT_FALLBACK_LANGUAGE);
        setSelectedEmailTemplateId(templateId);
        setSelectedEmailTemplateDescription(availableEmailTemplatesList?.find(
            (template: EmailTemplateType) => template.id === templateId)?.description);
    };

    const handleTemplateChange = (template: EmailTemplate) => {
        setSelectedEmailTemplate({ ...template });
    };

    const handleLocaleChange = (locale: string) => {
        setCurrentEmailTemplate({ ...selectedEmailTemplate });
        setIsTemplateNotAvailable(false);
        setSelectedLocale(locale);
    };

    const handleSubmit = () => {
        const template: EmailTemplate = {
            ...selectedEmailTemplate,
            id: selectedLocale.replace("-", "_")
        };

        if (isTemplateNotAvailable) {
            createNewEmailTemplate(selectedEmailTemplateId, template)
                .then((_response: EmailTemplate) => {
                    dispatch(addAlert<AlertInterface>({
                        description: t("extensions:develop.emailTemplates.notifications.updateEmailTemplate" +
                            ".success.description"),
                        level: AlertLevels.SUCCESS,
                        message: t("extensions:develop.emailTemplates.notifications.updateEmailTemplate" +
                            ".success.message")
                    }));
                }).catch((error: IdentityAppsApiException) => {
                    dispatch(addAlert<AlertInterface>({
                        description: t("extensions:develop.emailTemplates.notifications.updateEmailTemplate" +
                            ".error.description"),
                        level: AlertLevels.ERROR,
                        message: error.message ?? t("extensions:develop.emailTemplates.notifications" +
                            ".updateEmailTemplate.error.message")
                    }));
                }).finally(() => emailTemplateMutate());
        } else {
            updateEmailTemplate(selectedEmailTemplateId, template, selectedLocale)
                .then((_response: EmailTemplate) => {
                    dispatch(addAlert<AlertInterface>({
                        description: t("extensions:develop.emailTemplates.notifications.updateEmailTemplate" +
                            ".success.description"),
                        level: AlertLevels.SUCCESS,
                        message: t("extensions:develop.emailTemplates.notifications.updateEmailTemplate" +
                            ".success.message")
                    }));
                }).catch((error: IdentityAppsApiException) => {
                    dispatch(addAlert<AlertInterface>({
                        description: t("extensions:develop.emailTemplates.notifications.updateEmailTemplate" +
                            ".error.description"),
                        level: AlertLevels.ERROR,
                        message: error.message ?? t("extensions:develop.emailTemplates.notifications" +
                            ".updateEmailTemplate.error.message")
                    }));
                }).finally(() => emailTemplateMutate());
        }

        setIsTemplateNotAvailable(false);
    };

    const handleDeleteRequest = () => {
        deleteEmailTemplate(selectedEmailTemplateId, selectedLocale)
            .then((_response: AxiosResponse) => {
                dispatch(addAlert<AlertInterface>({
                    description: t("extensions:develop.emailTemplates.notifications.deleteEmailTemplate" +
                        ".success.description"),
                    level: AlertLevels.SUCCESS,
                    message: t("extensions:develop.emailTemplates.notifications.deleteEmailTemplate" +
                        ".success.message")
                }));
            }).catch((error: IdentityAppsApiException) => {
                dispatch(addAlert<AlertInterface>({
                    description: t("extensions:develop.emailTemplates.notifications.deleteEmailTemplate" +
                        ".error.description"),
                    level: AlertLevels.ERROR,
                    message: error.message ?? t("extensions:develop.emailTemplates.notifications" +
                        ".deleteEmailTemplate.error.message")
                }));
            }).finally(() => {
                setSelectedLocale(I18nConstants.DEFAULT_FALLBACK_LANGUAGE);
            });
    };

    const replicatePreviousTemplate = () => {
        setSelectedEmailTemplate(currentEmailTemplate);
        setShowReplicatePreviousTemplateModal(false);
    };

    const cancelReplicationOfPreviousTemplate = () => {
        setSelectedEmailTemplate(undefined);
        setCurrentEmailTemplate(undefined);
        setShowReplicatePreviousTemplateModal(false);
    };

    const resolveTabPanes = ():  TabProps[ "panes" ] => {
        const panes: TabProps [ "panes" ] = [];

        panes.push({
            menuItem: t("extensions:develop.emailTemplates.tabs.preview.label"),
            render: () => (
                <ResourceTab.Pane
                    className="email-template-resource-tab-pane"
                    attached="bottom"
                    data-componentid="email-customization-template-preview"
                >
                    <EmailTemplatePreview
                        emailTemplate={ selectedEmailTemplate || currentEmailTemplate }
                    />
                </ResourceTab.Pane>
            )
        });

        panes.push({
            menuItem: t("extensions:develop.emailTemplates.tabs.content.label"),
            render: () => (
                <ResourceTab.Pane
                    className="email-template-resource-tab-pane"
                    attached="bottom"
                    data-componentid="email-customization-template-content"
                >
                    <EmailCustomizationForm
                        isEmailTemplatesListLoading={ isEmailTemplatesListLoading || isEmailTemplateLoading }
                        selectedEmailTemplate={ currentEmailTemplate }
                        selectedLocale={ selectedLocale }
                        onTemplateChanged={ (template: EmailTemplate) => handleTemplateChange(template) }
                        onSubmit={ handleSubmit }
                        onDeleteRequested={ handleDeleteRequest }
                    />
                </ResourceTab.Pane>
            )
        });

        return panes;
    };

    const goToEmailProvider = () => {
        history.push(AppConstants.getPaths().get("EMAIL_PROVIDER"));
    };

    return (
        <PageLayout
            title={ t("extensions:develop.emailTemplates.page.header") }
            pageTitle="Email Templates"
            description={ (
                <>
                    { t("extensions:develop.emailTemplates.page.description") }
                    <DocumentationLink
                        link={ getLink("develop.emailCustomization.learnMore") }
                    >
                        { t("extensions:common.learnMore") }
                    </DocumentationLink>
                </> )
            }
            titleTextAlign="left"
            bottomMargin={ false }
            data-componentid={ componentId }
            action={
                featureConfig.emailProviders?.enabled &&
                (
                    <SecondaryButton onClick={ goToEmailProvider }>
                        { "Configure " + t("extensions:develop.sidePanel.emailProvider") }
                    </SecondaryButton>
                )
            }
        >
            <EmailCustomizationHeader
                selectedEmailTemplateId={ selectedEmailTemplateId }
                selectedEmailTemplateDescription={ selectedEmailTemplateDescription }
                selectedLocale={ selectedLocale }
                emailTemplatesList={ availableEmailTemplatesList }
                onTemplateSelected={ handleTemplateIdChange }
                onLocaleChanged={ handleLocaleChange }
            />

            <ResourceTab
                attached="top"
                secondary={ false }
                pointing={ false }
                panes={ resolveTabPanes() }
                onTabChange={ () => {
                    setCurrentEmailTemplate(selectedEmailTemplate);
                } }
                data-componentid={ `${ componentId }-forms` }
            />

            <EmailCustomizationFooter
                isSaveButtonLoading={ isEmailTemplatesListLoading || isEmailTemplateLoading }
                onSaveButtonClick={ handleSubmit }
            />

            <ConfirmationModal
                type="info"
                open={ showReplicatePreviousTemplateModal }
                primaryAction={ t("common:confirm") }
                secondaryAction={ t("common:cancel") }
                onSecondaryActionClick={ (): void => cancelReplicationOfPreviousTemplate() }
                onPrimaryActionClick={ (): void => replicatePreviousTemplate() }
                data-componentid={ `${ componentId }-replicate-previous-template-confirmation-modal` }
                closeOnDimmerClick={ false }
            >
                <ConfirmationModal.Header
                    data-componentid={ `${ componentId }-replicate-previous-template-confirmation-modal-header` }
                >
                    { t("extensions:develop.emailTemplates.modal.replicateContent.header") }
                </ConfirmationModal.Header>
                <ConfirmationModal.Message
                    attached
                    info
                    data-componentid={ `${ componentId }-replicate-previous-template-confirmation-modal-message` }
                >
                    { t("extensions:develop.emailTemplates.modal.replicateContent.message") }
                </ConfirmationModal.Message>
            </ConfirmationModal>
        </PageLayout>
    );
};

/**
 * Default props for the component.
 */
EmailCustomizationPage.defaultProps = {
    "data-componentid": "email-customization-page"
};

export default EmailCustomizationPage;
