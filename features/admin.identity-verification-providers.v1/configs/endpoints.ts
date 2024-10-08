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

import { IdVPResourceEndpointsInterface } from "../models/identity-verification-providers";

/**
 * Get the resource endpoints for managing the Identity Verification Providers
 *
 * @param serverHost - Server Host.
 * @returns The endpoints related to the Identity Verification Providers.
 */
export const getIDVPResourceEndpoints = (serverHost: string): IdVPResourceEndpointsInterface => {
    return {
        IDVPExtensionEndpoint: `${ serverHost }/api/server/v1/extensions/identity-verification-providers`,
        identityVerificationProviders: `${ serverHost }/api/server/v1/idv-providers`
    };
};
