/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Runtime platform factory
 *
 * This module is a NodeJS compatible version of a factory that will
 * produce an implementation module provides OpenWhisk Language
 * Runtime functionality and is able to register endpoints/handlers
 * allowing to host OpenWhisk Actions and process OpenWhisk Activations.
 */

var dbg = require('../utils/debug');
var DEBUG = new dbg();

// Export supported platform impls.
const PLATFORM_OPENWHISK = 'openwhisk';
const PLATFORM_KNATIVE =  'knative';

const SUPPORTED_PLATFORMS = [
    PLATFORM_OPENWHISK,
    PLATFORM_KNATIVE
];

module.exports = class PlatformFactory {

    /**
     *
     * @returns {string[]} List of supported platforms by their string ID
     */
    static get SUPPORTED_PLATFORMS() {
        return SUPPORTED_PLATFORMS;
    }

    static get PLATFORM_OPENWHISK() {
        return PLATFORM_OPENWHISK;
    }

    static get PLATFORM_KNATIVE() {
        return PLATFORM_KNATIVE;
    }

    /**
     * Object constructor
     * @param svc Runtime services
     * @param cfg Runtime configuration
     */
    constructor (svc, cfg) {
        DEBUG.dumpObject(svc,"svc");
        DEBUG.dumpObject(cfg,"cfg");
        this.service = svc;
        this.config = cfg;
    }

    /**
     * Instantiate a platform implementation
     * @param id Platform ID
     * @returns {PlatformImpl} Platform instance (interface), as best can be done with NodeJS
     */
    // TODO remove "app" parameter once we have a valid openwhisk platformImpl.
    createPlatformImpl(id, app){
        DEBUG.functionStart();
        DEBUG.dumpObject(id,"id");
        switch (id.toLowerCase()) {
            case PLATFORM_KNATIVE:
                // Load the Knative implementation and return it
                var knPlatformImpl = require('./knative.js');
                var platform = new knPlatformImpl(this, this.service, this.config);
                this.platformImpl = platform;
                break;
            case PLATFORM_OPENWHISK:
                var owPlatformImpl = require('./openwhisk.js');
                var platform = new owPlatformImpl(this, this.service, this.config);
                this.platformImpl = platform;
                break;
            default:
                console.error("Platform ID is not a known value (" + id + ").");
        }
        DEBUG.dumpObject(this.platformImpl,"platformImpl");
        DEBUG.functionEnd();
        return this.platformImpl;
    }

    /**
     * Wraps an endpoint written to return a Promise into an express endpoint,
     * producing the appropriate HTTP response and closing it for all controllable
     * failure modes.
     *
     * The expected signature for the promise value (both completed and failed)
     * is { code: int, response: object }.
     *
     * @param ep a request=>promise function
     * @returns an express endpoint handler
     */
    wrapEndpoint(ep) {
        DEBUG.functionStart("wrapping: " + ep.name);
        DEBUG.functionEnd("returning wrapper: " + ep.name);
        return function (req, res) {
            try {
                ep(req).then(function (result) {
                    res.status(result.code).json(result.response);
                    DEBUG.dumpObject(result,"result");
                    DEBUG.dumpObject(res,"response");
                    DEBUG.functionEndSuccess("wrapper for: " + ep.name);
                }).catch(function (error) {
                    if (typeof error.code === "number" && typeof error.response !== "undefined") {
                        res.status(error.code).json(error.response);
                    } else {
                        console.error("[wrapEndpoint]", "invalid errored promise", JSON.stringify(error));
                        res.status(500).json({ error: "Internal error." });
                    }
                    DEBUG.dumpObject(error,"error");
                    DEBUG.dumpObject(res,"response");
                    DEBUG.functionEndError(error, "wrapper for: " + ep.name);
                });
            } catch (e) {
                // This should not happen, as the contract for the endpoints is to
                // never (externally) throw, and wrap failures in the promise instead,
                // but, as they say, better safe than sorry.
                console.error("[wrapEndpoint]", "exception caught", e.message);
                res.status(500).json({ error: "Internal error (exception)." });
                DEBUG.dumpObject(error,"error");
                DEBUG.functionEndError(error, ep.name);
            }
        }
    }
};
