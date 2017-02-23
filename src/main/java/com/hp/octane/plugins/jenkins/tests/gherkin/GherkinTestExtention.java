/*
 *     Copyright 2017 Hewlett-Packard Development Company, L.P.
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 *
 */

package com.hp.octane.plugins.jenkins.tests.gherkin;

import com.hp.octane.plugins.jenkins.actions.cucumber.CucumberTestResultsAction;
import com.hp.octane.plugins.jenkins.tests.HPRunnerType;
import com.hp.octane.plugins.jenkins.tests.MqmTestsExtension;
import com.hp.octane.plugins.jenkins.tests.TestProcessingException;
import com.hp.octane.plugins.jenkins.tests.TestResultContainer;
import com.hp.octane.plugins.jenkins.tests.testResult.TestResult;
import hudson.Extension;
import hudson.model.AbstractBuild;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.IOException;
import java.util.List;

@Extension
public class GherkinTestExtention extends MqmTestsExtension {
    private static Logger logger = LogManager.getLogger(GherkinTestExtention.class);

    @Override
    public boolean supports(AbstractBuild<?, ?> build) throws IOException, InterruptedException {
        if (build.getAction(CucumberTestResultsAction.class) != null) {
            logger.debug("CucumberTestResultsAction found, gherkin results expected");
            return true;
        } else {
            logger.debug("CucumberTestResultsAction not found, no gherkin results expected");
            return false;
        }
    }

    @Override
    public TestResultContainer getTestResults(AbstractBuild<?, ?> build, HPRunnerType hpRunnerType, String jenkinsRootUrl) throws TestProcessingException, IOException, InterruptedException {
        try {
            List<TestResult> testResults = GherkinTestResultsCollector.collectGherkinTestsResults(build.getRootDir());
            return new TestResultContainer(testResults.iterator(), null);
        } catch (IOException e) {
            throw e;
        } catch (InterruptedException e) {
            throw e;
        } catch (Exception e) {
            throw new TestProcessingException("Error while processing gherkin test results", e);
        }
    }
}
