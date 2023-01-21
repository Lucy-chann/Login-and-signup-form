import { useState, useEffect } from "react";
import { useFormik } from "formik";
import { createUserToken } from "../../services/userServices";
import { checkDoesAccountExist } from "../../services/accountServices";
import {
  initialValues,
  validationSchema,
  onSubmit,
} from "./signupRequiredValues";
import stepInputDatas from "./stepInputDatas";
import toast from "react-hot-toast";
import HeaderTitle from "../../components/HeaderTitle/HeaderTitle";
import {
  AuthForm,
  InputWrapper,
} from "../../styles/StyledElements/StyledElements";
import MainInput from "../../components/StyledInput/MainInput";
import MethodSelection from "../../containers/MethodSelection/MethodSelection";
import MainButton from "../../components/StyledButton/MainButton";
import AuthMethodSelection from "../../components/AuthMethodSelection/AuthMethodSelection";
import ImageSelectSection from "../../components/ImageSelectInput/ImageSelectSection";
import { convertToBase64 } from "../../utils/utils";
import { useMemo } from "react";

const Signup = (props) => {
  const [signupStepIndex, setSignupStepIndex] = useState(0);

  const formik = useFormik({
    initialValues,
    initialErrors: initialValues,
    validationSchema: () => validationSchema(formik.values.selectedMethod),
    onSubmit: (values) => onSubmit(values, props.history.push),
  });

  const formikSelectedMethod = formik.values.selectedMethod;

  useEffect(() => {
    formik.setValues({ ...formikValues, email: "", number: "" });
    formik.setTouched({ ...formik.touched, email: false, number: false });

    document
      .querySelectorAll("#main-signup-inputs input")
      .forEach((inp) => (inp.value = ""));
  }, [formikSelectedMethod]);

  const formikValues = formik.values;

  const isOnSubmit =
    signupStepIndex === stepInputDatas.length - 1 ? true : false;

  const handleSignupStep = (e) => {
    e.preventDefault();

    const putTokenPromise = formik.setValues({
      ...formikValues,
      displayEmail: formik.values.email,
    });

    putTokenPromise
      .then(() => {
        !formikValues.userToken &&
          formik.setValues({ ...formikValues, userToken: createUserToken() });
      })
      .catch((err) => console.error(err));

    const errorKeys = Object.keys(formik.errors);

    const inpErrors = stepInputDatas[signupStepIndex].filter((inpData) => {
      if (!inpData.togglingInputs) {
        return errorKeys.includes(inpData.name);
      }
      return formikSelectedMethod === "email"
        ? errorKeys.includes(inpData.togglingInputs[0].name)
        : errorKeys.includes(inpData.togglingInputs[1].name);
    });

    let shouldStopOnStep = false;

    const errorText = `${formikSelectedMethod.replace(
      formikSelectedMethod.charAt(0),
      formikSelectedMethod.charAt(0).toUpperCase()
    )} already exists!`;

    if (inpErrors.length === 0) {
      if (
        stepInputDatas[signupStepIndex].some((inputData) => {
          return inputData.checkExistence;
        })
      ) {
        shouldStopOnStep = true;
        const loadingToast = toast.loading("Checking account...");
        checkDoesAccountExist(formikValues)
          .then((res) => {
            toast.dismiss(loadingToast);
            if (res.length > 0) {
              formik.setErrors({
                ...formik.errors,
                [formikSelectedMethod]: errorText,
              });

              toast.error(errorText);
            } else {
              shouldStopOnStep = false;
              !shouldStopOnStep && setSignupStepIndex(signupStepIndex + 1);
              toast.success("Account available");
            }
          })
          .catch((err) => console.error(err));
      }
      if (!isOnSubmit) {
        !shouldStopOnStep && setSignupStepIndex(signupStepIndex + 1);
      } else {
        formik.submitForm();
      }
    } else {
      inpErrors.reverse().forEach((inpError) => {
        if (!inpError.togglingInputs) {
          if (formik.errors[inpError.name] !== "")
            toast.error(formik.errors[inpError.name]);
          else toast.error(`${inpError.placeholderText} can't be empty`);
        } else {
          if (formikSelectedMethod === "email") {
            formik.errors[inpError.togglingInputs[0].name] !== ""
              ? toast.error(formik.errors[inpError.togglingInputs[0].name])
              : toast.error(
                  `${inpError.togglingInputs[0].placeholderText} can't be empty`
                );
          } else {
            formik.errors[inpError.togglingInputs[1].name] !== ""
              ? toast.error(formik.errors[inpError.togglingInputs[1].name])
              : toast.error(
                  `${inpError.togglingInputs[1].placeholderText} can't be empty`
                );
          }
        }
      });
    }
  };

  const handleRemoveImage = () => {
    formik.setValues({ ...formikValues, profileImage: "" });
  };

  const handleAddImage = async (e) => {
    const [file] = e.target.files;
    const imageURL = await convertToBase64(file);
    await formik.setValues({ ...formikValues, profileImage: imageURL });
  };

  const handleMethod = (methodType) =>
    formik.setValues({ ...formikValues, selectedMethod: methodType });

  const handleInputProps = (name, togglingInputs, restInpDatas) => {
    if (togglingInputs) {
      return formikSelectedMethod === "email"
        ? {
            ...formik.getFieldProps(togglingInputs[0].name),
            ...togglingInputs[0],
          }
        : {
            ...formik.getFieldProps(togglingInputs[1].name),
            ...togglingInputs[1],
          };
    } else {
      return {
        ...formik.getFieldProps(name),
        ...restInpDatas,
      };
    }
  };

  const handleInputError = (inpTogglingName) => {
    return (
      formik.errors[inpTogglingName] && formik.touched[inpTogglingName] && true
    );
  };

  const methodSelector = useMemo(
    () => (
      <MethodSelection
        method={formikValues.selectedMethod}
        methodHandler={handleMethod}
      />
    ),
    [formikSelectedMethod]
  );

  return (
    <>
      <HeaderTitle
        mainTitle="create new account &#128293;"
        headerParagraph="please fill in the forms to continue"
      />
      <AuthForm
        style={{
          margin: "2rem 0",
          height:
            stepInputDatas[signupStepIndex].some((sid) => sid.id === 6) &&
            "27.5rem",
        }}
      >
        <InputWrapper>
          {signupStepIndex === 1 && methodSelector}
          <fieldset id="main-signup-inputs">
            {stepInputDatas[signupStepIndex].map(
              ({ id, type, name, togglingInputs, ...restInputData }) => {
                const inpTogglingName = togglingInputs
                  ? formikSelectedMethod === "email"
                    ? togglingInputs[0].name
                    : togglingInputs[1].name
                  : name;

                return ["text", "email", "password", "tel"].includes(
                  togglingInputs
                    ? formikSelectedMethod === "email"
                      ? togglingInputs[0].type
                      : togglingInputs[1].type
                    : type
                ) ? (
                  <MainInput
                    key={id}
                    type={type}
                    {...handleInputProps(name, togglingInputs, restInputData)}
                    isError={handleInputError(inpTogglingName)}
                  />
                ) : (
                  <ImageSelectSection
                    key={id}
                    imageSrc={formikValues.profileImage}
                    handleAddImage={handleAddImage}
                    handleRemoveImage={handleRemoveImage}
                  />
                );
              }
            )}
          </fieldset>
          <section style={{ marginTop: "20px" }}>
            <MainButton onClick={handleSignupStep}>
              {isOnSubmit ? "Create account" : "Next"}
            </MainButton>
            <AuthMethodSelection
              authText="Already have an account?"
              authRedirect={{ redirectLink: "/login", redirectText: "Login" }}
            />
          </section>
        </InputWrapper>
      </AuthForm>
    </>
  );
};

export default Signup;
