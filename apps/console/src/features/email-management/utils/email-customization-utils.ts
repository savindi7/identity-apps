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

import {
    BrandingPreferenceInterface,
    BrandingPreferenceThemeInterface,
    PredefinedThemes,
    ThemeConfigInterface
} from "../../../extensions/components/branding/models";
import { BrandingPreferenceUtils } from "../../../extensions/components/branding/utils";

export class EmailCustomizationUtils {

    private static readonly brandingFallBackValues: Record<string, string> = {
        background_color: "#F8F9FA",
        button_font_color: "#FFFFFF",
        copyright_text: "&#169; YYYY WSO2 LLC.",
        dark_background_color: "#111111",
        dark_border_color: "#333333",
        dark_logo_url: "https://wso2.cachefly.net/wso2/sites/all/2022/images/asgadeo-logo-white.png",
        font_color: "#231F20",
        font_style: "Montserrat",
        light_background_color: "#FFFFFF",
        light_border_color: "transparent",
        light_logo_url: "https://wso2.cachefly.net/wso2/sites/all/2021/images/asgardeo-wso2-logo-white.png",
        primary_color: "#FF7300"
    }

    /**
     * Private constructor to avoid object instantiation from outside
     * the class.
     *
     */
    private constructor() { }

    /**
     * Get the template body with the branding configs.
     *
     * @param organizationName - Current organization name
     * @param brandingConfigs - Current branding configs
     * @param templateBody - Email template body (HTML template)
     * @param predefinedThemes - Predefined themes
     */
    public static getTemplateBody(
        organizationName: string,
        brandingConfigs: BrandingPreferenceInterface,
        templateBody: string,
        predefinedThemes: BrandingPreferenceThemeInterface
    ): string {
        if (!brandingConfigs) {
            return templateBody
                .replace(/{{organization.color.background}}/g, this.brandingFallBackValues.background_color)
                .replace(/{{organization.color.primary}}/g, this.brandingFallBackValues.primary_color)
                .replace(/{{organization.theme.background.color}}/g, this.brandingFallBackValues.light_background_color)
                .replace(/{{organization.theme.border.color}}/g, this.brandingFallBackValues.light_border_color)
                .replace(/{{organization.font}}/g, this.brandingFallBackValues.font_style)
                .replace(/{{organization.font.color}}/g, this.brandingFallBackValues.font_color)
                .replace(/{{organization.button.font.color}}/g, this.brandingFallBackValues.button_font_color)
                .replace(/{{organization-name}}/g, organizationName)
                .replace(/{{organization.logo.img}}/g, this.brandingFallBackValues.light_logo_url);
        }

        const {
            organizationDetails: {
                copyrightText,
                supportEmail
            },
            theme
        } = BrandingPreferenceUtils.migrateThemePreference(brandingConfigs, {
            theme: predefinedThemes
        });

        const currentTheme: ThemeConfigInterface = theme[theme.activeTheme];
        const defaultOrgLogo: string = (theme.activeTheme === PredefinedThemes.DARK
            ? this.brandingFallBackValues.dark_logo_url : this.brandingFallBackValues.light_logo_url);

        return templateBody
            .replace(/{{organization.color.background}}/g, currentTheme.colors.background.body.main)
            .replace(/{{organization.color.primary}}/g, currentTheme.colors.primary.main)
            .replace(
                /{{organization.theme.background.color}}/g,
                currentTheme.colors.background.surface.main
                    ? currentTheme.colors.background.surface.main
                    : theme.activeTheme === PredefinedThemes.DARK
                        ? "#111111"
                        : "#FFFFFF"
            )
            .replace(
                /{{organization.theme.border.color}}/g,
                currentTheme.colors.outlined.default
                    ? currentTheme.colors.outlined.default
                    : theme.activeTheme === PredefinedThemes.DARK
                        ? "#333333"
                        : "transparent"
            )
            .replace(/{{organization.font}}/g, currentTheme.typography.font.fontFamily)
            .replace(/{{organization.font.color}}/g, currentTheme.colors.text.primary)
            .replace(/{{organization.button.font.color}}/g, currentTheme.buttons.primary.base.font.color)
            .replace(/{{organization-name}}/g, organizationName)
            .replace(/{{organization.logo.img}}/g, currentTheme.images.logo.imgURL || defaultOrgLogo)
            .replace(/{{organization.logo.altText}}/g, currentTheme.images.logo.altText)
            .replace(/{{organization.copyright.text}}/g, copyrightText)
            .replace(/{{organization.support.mail}}/g, supportEmail);
    }
}
