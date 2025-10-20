import { createContext, useContext, useState, useEffect } from "react"
import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../lib/firebase"

const ExamContext = createContext({})

export const useExam = () => {
  const context = useContext(ExamContext)
  if (!context) {
    throw new Error("useExam must be used within ExamProvider")
  }
  return context
}

export function ExamProvider({ children }) {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(false)

  const createExam = async (examData) => {
    try {
      const docRef = await addDoc(collection(db, "exams"), {
        ...examData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating exam:", error)
      throw error
    }
  }

  const getExamsByClass = async (classId) => {
    try {
      const q = query(collection(db, "exams"), where("classId", "==", classId))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error("Error fetching exams:", error)
      return []
    }
  }

  const getExamById = async (examId) => {
    try {
      const docRef = doc(db, "exams", examId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      return null
    } catch (error) {
      console.error("Error fetching exam:", error)
      return null
    }
  }

  const updateExam = async (examId, examData) => {
    try {
      const docRef = doc(db, "exams", examId)
      await updateDoc(docRef, {
        ...examData,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating exam:", error)
      throw error
    }
  }

  const deleteExam = async (examId) => {
    try {
      await deleteDoc(doc(db, "exams", examId))
      const questionsQ = query(collection(db, "examQuestions"), where("examId", "==", examId))
      const questionsSnapshot = await getDocs(questionsQ)
      const deletePromises = questionsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)
    } catch (error) {
      console.error("Error deleting exam:", error)
      throw error
    }
  }

  const addQuestion = async (questionData) => {
    try {
      const docRef = await addDoc(collection(db, "examQuestions"), {
        ...questionData,
        createdAt: serverTimestamp(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error adding question:", error)
      throw error
    }
  }

  const getQuestionsByExam = async (examId) => {
    try {
      const q = query(collection(db, "examQuestions"), where("examId", "==", examId))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error("Error fetching questions:", error)
      return []
    }
  }

  const updateQuestion = async (questionId, questionData) => {
    try {
      const docRef = doc(db, "examQuestions", questionId)
      await updateDoc(docRef, questionData)
    } catch (error) {
      console.error("Error updating question:", error)
      throw error
    }
  }

  const deleteQuestion = async (questionId) => {
    try {
      await deleteDoc(doc(db, "examQuestions", questionId))
    } catch (error) {
      console.error("Error deleting question:", error)
      throw error
    }
  }

  const submitExamResult = async (userId, examId, answers, score) => {
    try {
      await addDoc(collection(db, "examResults"), {
        userId,
        examId,
        answers,
        score,
        submittedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error submitting exam result:", error)
      throw error
    }
  }

  const getExamResult = async (userId, examId) => {
    try {
      const q = query(
        collection(db, "examResults"),
        where("userId", "==", userId),
        where("examId", "==", examId)
      )
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
      }
      return null
    } catch (error) {
      console.error("Error fetching exam result:", error)
      return null
    }
  }

  const value = {
    exams,
    loading,
    createExam,
    getExamsByClass,
    getExamById,
    updateExam,
    deleteExam,
    addQuestion,
    getQuestionsByExam,
    updateQuestion,
    deleteQuestion,
    submitExamResult,
    getExamResult,
  }

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>
}
