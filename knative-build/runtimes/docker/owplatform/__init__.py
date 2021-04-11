 #
 # Licensed to the Apache Software Foundation (ASF) under one or more
 # contributor license agreements.  See the NOTICE file distributed with
 # this work for additional information regarding copyright ownership.
 # The ASF licenses this file to You under the Apache License, Version 2.0
 # (the "License"); you may not use this file except in compliance with
 # the License.  You may obtain a copy of the License at
 #
 #     http://www.apache.org/licenses/LICENSE-2.0
 #
 # Unless required by applicable law or agreed to in writing, software
 # distributed under the License is distributed on an "AS IS" BASIS,
 # WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 # See the License for the specific language governing permissions and
 # limitations under the License.
 #

class PlatformFactory:

    _SUPPORTED_PLATFORMS = set()
    _PLATFORM_IMPLEMENTATIONS = {}

    def __init__(self):
        pass

    @classmethod
    def supportedPlatforms(cls):
        return cls._SUPPORTED_PLATFORMS

    @classmethod
    def isSupportedPlatform(cls, id):
        return id.lower() in cls._SUPPORTED_PLATFORMS

    @classmethod
    def addPlatform(cls, platform, platformImp):
        if platform.lower not in cls._SUPPORTED_PLATFORMS:
            cls._SUPPORTED_PLATFORMS.add(platform.lower())
            cls._PLATFORM_IMPLEMENTATIONS[platform.lower()] = platformImp
        else:
            raise DuplicatePlatform()
        getterName = "PLATFORM_" + platform.upper()
        setattr(cls, getterName, platform)

    @classmethod
    def createPlatformImpl(cls, id):
        if cls.isSupportedPlatform(id):
            return cls._PLATFORM_IMPLEMENTATIONS[id.lower()]()
        else:
            raise InvalidPlatformError(id, self.supportedPlatforms())

    @property
    def app(self):
        return self._app

    @app.setter
    def app(self, value):
        raise ConstantError("app cannot be set outside of initialization")

    @property
    def config(self):
        return self._config

    @config.setter
    def config(self, value):
        raise ConstantError("config cannot be set outside of initialization")

    @property
    def service(self):
        return self._service

    @service.setter
    def service(self, value):
        raise ConstantError("service cannot be set outside of initialization")

class ConstantError(Exception):
    pass

class DuplicatePlatformError(Exception):
    pass

class InvalidPlatformError(Exception):
    def __init__(self, platform, supportedPlatforms):
        self.platform = platform.lower()
        self.supportedPlatforms = supportedPlatforms

    def __str__(self):
        return f"Invalid Platform: {self.platform} is not in supported platforms {self.supportedPlatforms}."
